export async function executeCode(req, res) {
  try {
    const { language, code } = req.body;

    const ONECOMPILER_API = "https://onecompiler.com/api/code/exec";

    const LANGUAGE_VERSIONS = {
      javascript: { language: "nodejs" },
      python: { language: "python" },
      java: { language: "java" },
    };

    const languageConfig = LANGUAGE_VERSIONS[language];

    if (!languageConfig) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language: ${language}`,
      });
    }

    const response = await fetch(ONECOMPILER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          language: languageConfig.language,
          files: [
            {
              name: `main.txt`,
              content: code,
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `HTTP error! status: ${response.status}`,
      });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.log("Error in executeCode controller:", error.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
