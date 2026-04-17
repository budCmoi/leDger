var config = {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                ink: '#FFF6E8',
                paper: '#0A0813',
                accent: '#F5C65B',
                accent2: '#FF8C61',
                accent3: '#5BC0FF',
                accent4: '#7AE7C7',
                border: '#312846',
                muted: '#B8A885',
                surface: '#151022',
            },
            fontFamily: {
                sans: ['Space Mono', 'monospace'],
                mono: ['Space Mono', 'monospace'],
                display: ['Space Mono', 'monospace'],
            },
            boxShadow: {
                soft: '0 18px 40px rgba(6, 5, 14, 0.34), 0 0 0 1px rgba(245, 198, 91, 0.05)',
            },
            backgroundImage: {
                grain: 'radial-gradient(circle at top, rgba(245, 198, 91, 0.18), transparent 42%), radial-gradient(circle at 82% 18%, rgba(91, 192, 255, 0.14), transparent 26%), linear-gradient(135deg, rgba(255, 140, 97, 0.14), transparent 38%)',
            },
        },
    },
    plugins: [],
};
export default config;
