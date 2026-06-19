import { MantineProvider, createTheme } from '@mantine/core';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import '@mantine/core/styles.css';
import Home from '@/pages/Home';

const theme = createTheme({
  primaryColor: 'cyan',
  colors: {
    cyan: [
      '#e6faff',
      '#b8f0ff',
      '#8ae6ff',
      '#5cdcff',
      '#2ed2ff',
      '#00c8ff',
      '#00a8d6',
      '#0088a9',
      '#00687c',
      '#004850',
    ],
    dark: [
      '#0a1628',
      '#1a2942',
      '#2a3f5f',
      '#3a5a80',
      '#4a6fa0',
      '#5a85c0',
      '#6a9ae0',
      '#7ab0ff',
      '#8ac5ff',
      '#9adbff',
    ],
  },
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace:
    'JetBrains Mono, "Fira Code", "Consolas", "Monaco", monospace',
  defaultRadius: 'md',
});

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </Router>
    </MantineProvider>
  );
}
