using System.Diagnostics;
using System.Net.Http;

namespace LeDger.Desktop;

internal sealed class BackendProcessHost : IAsyncDisposable
{
    private readonly HttpClient _httpClient = new()
    {
        Timeout = TimeSpan.FromSeconds(2),
    };

    private Process? _backendProcess;

    public Uri ApplicationUri { get; } = new("http://127.0.0.1:4000/");

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (_backendProcess is { HasExited: false })
        {
            return;
        }

        var appRoot = AppContext.BaseDirectory;
        var backendEntry = Path.Combine(appRoot, "backend", "dist", "server.js");

        if (!File.Exists(backendEntry))
        {
            throw new FileNotFoundException("Le backend compile est introuvable.", backendEntry);
        }

        var nodeExecutable = ResolveNodeExecutable(appRoot);

        var startInfo = new ProcessStartInfo
        {
            FileName = nodeExecutable,
            Arguments = $"\"{backendEntry}\"",
            WorkingDirectory = appRoot,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
        };

        startInfo.Environment["NODE_ENV"] = "production";
        startInfo.Environment["PORT"] = "4000";
        startInfo.Environment["CLIENT_URL"] = "http://127.0.0.1:4000,http://localhost:4000";

        _backendProcess = Process.Start(startInfo) ?? throw new InvalidOperationException("Impossible de lancer le backend Node.");
        _backendProcess.OutputDataReceived += OnBackendOutputDataReceived;
        _backendProcess.ErrorDataReceived += OnBackendOutputDataReceived;
        _backendProcess.BeginOutputReadLine();
        _backendProcess.BeginErrorReadLine();

        await WaitUntilHealthyAsync(cancellationToken);
    }

    private static string ResolveNodeExecutable(string appRoot)
    {
        var bundledNode = Path.Combine(appRoot, "runtime", "node.exe");
        if (File.Exists(bundledNode))
        {
            return bundledNode;
        }

        return "node";
    }

    private async Task WaitUntilHealthyAsync(CancellationToken cancellationToken)
    {
        Exception? lastError = null;

        for (var attempt = 0; attempt < 60; attempt += 1)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (_backendProcess is { HasExited: true } exitedProcess)
            {
                throw new InvalidOperationException($"Le backend s est arrete prematurement avec le code {exitedProcess.ExitCode}.", lastError);
            }

            try
            {
                using var response = await _httpClient.GetAsync(new Uri(ApplicationUri, "healthz"), cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    return;
                }
            }
            catch (Exception error) when (error is HttpRequestException or TaskCanceledException)
            {
                lastError = error;
            }

            await Task.Delay(500, cancellationToken);
        }

        throw new InvalidOperationException("Le backend n a pas repondu a temps.", lastError);
    }

    private static void OnBackendOutputDataReceived(object sender, DataReceivedEventArgs eventArgs)
    {
        if (!string.IsNullOrWhiteSpace(eventArgs.Data))
        {
            Debug.WriteLine(eventArgs.Data);
        }
    }

    public async ValueTask DisposeAsync()
    {
        _httpClient.Dispose();

        if (_backendProcess is null)
        {
            return;
        }

        try
        {
            if (!_backendProcess.HasExited)
            {
                _backendProcess.Kill(entireProcessTree: true);
                await _backendProcess.WaitForExitAsync();
            }
        }
        catch (InvalidOperationException)
        {
        }
        finally
        {
            _backendProcess.Dispose();
            _backendProcess = null;
        }
    }
}