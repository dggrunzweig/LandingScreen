import { defineConfig } from 'vite'

const basic_config = () => {
    return {};
}
export default defineConfig(({ mode }) => {
    if (mode === 'production') {
        return {
            ...basic_config(),
            build: {
                rollupOptions: {
                    input: "./src/main.ts",
                    output: {
                        format: 'es',
                        dir: 'dist',
                        entryFileNames: 'bundle.js',
                    }
                },
                minify: 'terser',
                terserOptions: {
                    compress: {
                        drop_console: true
                    },
                }
            }
        }
    } else
        return basic_config();
})    