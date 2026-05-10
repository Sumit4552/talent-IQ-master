import axiosInstance from "./axios";

export async function executeCode(language, code) {
  try {
    const response = await axiosInstance.post("/execute", { language, code });
    const data = response.data;

    const output = data.stdout || "";
    const stderr = data.stderr || data.exception || "";

    if (stderr) {
      return {
        success: false,
        output: output,
        error: stderr,
      };
    }

    return {
      success: true,
      output: output || "No output",
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || `Failed to execute code: ${error.message}`,
    };
  }
}
