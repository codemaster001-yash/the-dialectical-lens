
const fs = require('fs');
const path = require('path');

// This script is run by Netlify during the build process.

// Get the API key from the environment variable set in the Netlify UI.
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("Build Error: GEMINI_API_KEY environment variable not set in Netlify.");
    console.error("Please go to Site settings > Build & deploy > Environment and add it.");
    process.exit(1); // Exit with a failure code to stop the build.
}

// Define the path to the index.html file, which is in the parent directory.
const indexPath = path.join(__dirname, '..', 'index.html');

try {
    // Read the entire index.html file into memory.
    let content = fs.readFileSync(indexPath, 'utf8');

    // Perform the replacement.
    // The placeholder '%%GEMINI_API_KEY%%' will be replaced by the actual key.
    content = content.replace(/%%GEMINI_API_KEY%%/g, apiKey);

    // Write the modified content back to the index.html file.
    fs.writeFileSync(indexPath, content, 'utf8');

    console.log("Success: API key has been securely injected into index.html.");

} catch (error) {
    console.error(`Error: Failed to read or write to file: ${indexPath}`);
    console.error(error);
    process.exit(1); // Exit with a failure code.
}
