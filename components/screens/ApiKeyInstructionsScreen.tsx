import React from 'react';

const ApiKeyInstructionsScreen: React.FC = () => {
  const localDevSnippet = `<!-- Located in the <head> of index.html -->
<script>
  window.CONVOLUTION_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
</script>`;

  return (
    <div className="fixed inset-0 z-[100] bg-light-primary dark:bg-dark-primary flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-light-secondary dark:bg-dark-secondary p-8 rounded-2xl shadow-2xl border-2 border-red-500 animate-fade-in">
        <h1 className="text-3xl font-bold text-red-600 dark:text-red-500 text-center">Configuration Required</h1>
        <p className="mt-4 text-center text-lg text-light-text/80 dark:text-dark-text/80">
          The application requires a Google Gemini API key to function.
        </p>
        
        <div className="mt-8 grid md:grid-cols-2 gap-8 text-left">
          
          {/* Local Development */}
          <div className="bg-light-primary dark:bg-dark-primary p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-3">For Local Development</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Open the <code className="bg-gray-300 dark:bg-gray-600 px-1 py-0.5 rounded-sm">index.html</code> file in your project.</li>
              <li>Find the script block shown below.</li>
              <li>Replace the placeholder with your actual API key.</li>
              <li>Save the file and reload the page.</li>
            </ol>
            <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto text-sm mt-4">
                <code>{localDevSnippet}</code>
            </pre>
          </div>

          {/* Netlify Deployment */}
          <div className="bg-light-primary dark:bg-dark-primary p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-3">For Netlify Deployment</h2>
            <ol className="list-decimal list-inside space-y-2">
                <li>Do <span className="font-bold">NOT</span> commit your API key to <code className="bg-gray-300 dark:bg-gray-600 px-1 py-0.5 rounded-sm">index.html</code>.</li>
                <li>Go to your site's dashboard on Netlify.</li>
                <li>Navigate to <span className="font-semibold">Site configuration &rarr; Build & deploy &rarr; Environment</span>.</li>
                <li>Click "Edit variables" and add a new variable:</li>
                <li className="list-none ml-4 mt-2">
                    - Key: <code className="bg-gray-300 dark:bg-gray-600 px-1 py-0.5 rounded-sm">GEMINI_API_KEY</code><br/>
                    - Value: <span className="italic">(Your actual API key)</span>
                </li>
                <li>Save and re-deploy your site.</li>
            </ol>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          This method ensures your API key is kept secure and is not exposed in your public code repository.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyInstructionsScreen;