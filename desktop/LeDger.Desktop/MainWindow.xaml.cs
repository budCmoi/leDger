using Microsoft.Web.WebView2.Core;

namespace LeDger.Desktop;

public partial class MainWindow : System.Windows.Window
{
    private readonly BackendProcessHost _backendHost = new();
    private readonly CancellationTokenSource _shutdownCancellation = new();

    public MainWindow()
    {
        InitializeComponent();
        Loaded += OnLoaded;
        Closing += OnClosing;
    }

    private async void OnLoaded(object sender, System.Windows.RoutedEventArgs eventArgs)
    {
        try
        {
            StatusText.Text = "Preparation du moteur d affichage...";
            await Browser.EnsureCoreWebView2Async();

            StatusText.Text = "Demarrage du backend local...";
            await _backendHost.StartAsync(_shutdownCancellation.Token);

            Browser.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
            Browser.CoreWebView2.Settings.AreDevToolsEnabled = true;
            Browser.CoreWebView2.Settings.IsStatusBarEnabled = false;
            Browser.NavigationCompleted += OnNavigationCompleted;

            StatusText.Text = "Chargement de l application...";
            Browser.Source = _backendHost.ApplicationUri;
        }
        catch (Exception error)
        {
            StatusText.Text = $"Impossible de lancer LeDger Desktop. {error.Message}";
        }
    }

    private void OnNavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs eventArgs)
    {
        if (eventArgs.IsSuccess)
        {
            LoadingOverlay.Visibility = System.Windows.Visibility.Collapsed;
            return;
        }

        StatusText.Text = $"La fenetre n a pas pu charger l application. Code WebView2: {eventArgs.WebErrorStatus}.";
    }

    private async void OnClosing(object? sender, System.ComponentModel.CancelEventArgs eventArgs)
    {
        Loaded -= OnLoaded;
        Closing -= OnClosing;
        _shutdownCancellation.Cancel();
        await _backendHost.DisposeAsync();
        _shutdownCancellation.Dispose();
    }
}