import React, { useEffect } from 'react';

const ThemeToggle: React.FC = () => {
    const toggleTheme = (): void => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme); // Save the user's preference
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    return (
        <button onClick={toggleTheme}>
            Toggle Dark Mode
        </button>
    );
};

export default ThemeToggle;



