
import React from 'react';

const ApiKeyInstructionsScreen: React.FC = () => {
  const localDevSnippet = `VITE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"`;

  return (
    <div className="fixed inset-0 z-[100] bg-light-primary dark:bg-dark-primary flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-light-secondary dark:bg-dark-secondary p-8 rounded-2xl shadow-2xl border-2 border-red-500 animate-fade-in">
        <h1 className="text-3xl font-bold text-red-600 dark:text-red-500 text-center">Configuration Required</h1>
        <p className="mt-4 text-center text-lg text-light-text/80 dark:text-dark-text/80">
          A Google Gemini API key is required. The application is now using a secure, standard build process.
        </p>
        
        <div className="mt-8 grid md:grid-cols-2 gap-8 text-left">
          
          {/* Local Development */}
          <div className="bg-light-primary dark:bg-dark-primary p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-3">For Local Development</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Create a new file named <code className="bg-gray-300 dark:bg-gray-600 px-1 py-0.5 rounded-sm">.env</code> in the root of your project.</li>
              <li>Add the following line to the file, replacing the placeholder with your key.</li>
              <li>Save the file and restart your local development server.</li>
            </ol>
            <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto text-sm mt-4">
                <code>{localDevSnippet}</code>
            </pre>
             <p className="text-xs text-gray-500 mt-2">Note: The <code className="bg-gray-300 dark:bg-gray-600 px-1 py-0.5 rounded-sm">.env</code> file is included in <code className="bg-gray-300 dark:bg-gray-600 px-1 py-0.5 rounded-sm">.gitignore</code> and should never be committed.</p>
          </div>

          {/* Netlify Deployment */}
          <div className="bg-light-primary dark:bg-dark-primary p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-3">For Netlify Deployment</h2>
            <ol className="list-decimal list-inside space-y-2">
                <li>Go to your site's dashboard on Netlify.</li>
                <li>Navigate to <span className="font-semibold">Site configuration &rarr; Build & deploy &rarr; Environment</span>.</li>
                <li>Click "Edit variables" and add a new variable:</li>
                <li className="list-none ml-4 mt-2">
                    - Key: <code className="bg-gray-300 dark:bg-gray-600 px-1 py-0.5 rounded-sm">VITE_GEMINI_API_KEY</code><br/>
                    - Value: <span className="italic">(Your actual API key)</span>
                </li>
                 <li>Ensure your Build Settings in the Netlify UI are set to:</li>
                 <li className="list-none ml-4 mt-2">
                    - Build command: <code className="bg-gray-300 dark:bg-gray-600 px-1 py-0.5 rounded-sm">npm run build</code><br/>
                    - Publish directory: <code className="bg-gray-300 dark:bg-gray-600 px-1 py-0.5 rounded-sm">dist</code>
                </li>
                <li>Save and re-deploy your site.</li>
            </ol>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          This secure method is standard practice for modern web applications.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyInstructionsScreen;
