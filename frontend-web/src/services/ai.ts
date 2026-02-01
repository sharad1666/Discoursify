import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getConfig = () => {
    const token = localStorage.getItem('authToken');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const generateSummary = async (text: string) => {
    try {
        const response = await axios.post(`${API_URL}/ai/evaluate`, { transcript: text }, getConfig());
        return response.data;
    } catch (error) {
        console.error("AI Generation Error:", error);
        return "Unable to generate summary at this time.";
    }
};

export const analyzeNews = async (articleContent: string) => {
    try {
        const response = await axios.post(`${API_URL}/ai/analyze-news`, { text: articleContent }, getConfig());
        return response.data;
    } catch (error: any) {
        console.error("AI Analysis Error:", error);
        return `Unable to analyze news. Error: ${error.message}${error.response ? ' - ' + error.response.status : ''}`;
    }
};

export const generateGDTopics = async (category: string = 'Random') => {
    try {
        const response = await axios.post(`${API_URL}/ai/generate-topics`, { category }, getConfig());
        let content = response.data;

        // If content is a string (JSON string), parse it
        if (typeof content === 'string') {
            // Remove markdown code blocks if present
            content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            try {
                return JSON.parse(content);
            } catch (e) {
                console.error("Error parsing topics JSON:", e);
                return getFallbackTopics();
            }
        }
        return content;
    } catch (error) {
        console.error("Topic Generation Error:", error);
        return getFallbackTopics();
    }
};

const getFallbackTopics = () => [
    { topic: 'Impact of AI on Employment', context: 'Exploring how artificial intelligence is reshaping the job market and creating new opportunities' },
    { topic: 'Climate Change and Global Policy', context: 'Analyzing international efforts to combat climate change and sustainable development' },
    { topic: 'Digital Privacy vs Security', context: 'Balancing personal privacy rights with national security needs in the digital age' },
    { topic: 'Future of Remote Work', context: 'Examining the long-term implications of remote work on productivity and work culture' },
    { topic: 'Social Media and Mental Health', context: 'Understanding the psychological impact of social media on society' },
    { topic: 'Renewable Energy Transition', context: 'Discussing the shift from fossil fuels to renewable energy sources' }
];

export const explainTopic = async (topic: string) => {
    try {
        const response = await axios.post(`${API_URL}/ai/explain-topic`, { topic }, getConfig());
        return response.data;
    } catch (error) {
        console.error("Explanation Error:", error);
        return "Unable to explain topic.";
    }
};

export const generateKeyPoints = async (topic: string) => {
    try {
        const response = await axios.post(`${API_URL}/ai/key-points`, { topic }, getConfig());
        return response.data;
    } catch (error) {
        console.error("Key Points Error:", error);
        return "Unable to generate key points.";
    }
};

export const generateDebateMotion = async (text: string) => {
    try {
        const response = await axios.post(`${API_URL}/ai/debate/motion`, { text }, getConfig());
        return response.data;
    } catch (error) {
        console.error("Debate Motion Error:", error);
        return "This house believes that this topic is worthy of debate.";
    }
};

export const evaluateArgument = async (motion: string, argument: string) => {
    try {
        const response = await axios.post(`${API_URL}/ai/debate/evaluate`, { motion, argument }, getConfig());
        let content = response.data;
        if (typeof content === 'string') {
            content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(content);
        }
        return content;
    } catch (error) {
        console.error("Argument Evaluation Error:", error);
        return { score: 0, strength: "Error", feedback: "Unable to evaluate.", improvement: "Try again." };
    }
};

export const getWordDefinition = async (word: string) => {
    try {
        const response = await axios.post(`${API_URL}/ai/dictionary`, { word }, getConfig());
        let content = response.data;
        if (typeof content === 'string') {
            content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            try {
                return JSON.parse(content);
            } catch (e) {
                console.error("JSON Parse Error", content);
                throw new Error("Received invalid response from AI.");
            }
        }
        return content;
    } catch (error: any) {
        console.error("Dictionary Error:", error);
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            throw new Error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
            // The request was made but no response was received
            throw new Error("No response from server. Is backend running?");
        } else {
            // Something happened in setting up the request that triggered an Error
            throw new Error(error.message);
        }
    }
};

export const generateDetailedReport = async (transcript: string[], _topic: string) => {
    // This function seems to be unused or duplicate of generateSummary/evaluate
    // But keeping it consistent if used elsewhere, mapping to evaluate for now or separate endpoint if needed
    // For now, let's map it to evaluate as it takes a transcript
    try {
        const transcriptText = transcript.join('\n');
        const response = await axios.post(`${API_URL}/ai/evaluate`, { transcript: transcriptText }, getConfig());
        return response.data;
    } catch (error) {
        console.error("Detailed Report Error:", error);
        return "Unable to generate detailed report.";
    }
};

// Mock phrases for fallback when backend is unreachable
const getMockPhrases = (context: string, _intent: string) => {
    return `1. "I understand your perspective, but I'd like to share a different view on ${context}."
2. "That's a valid point. However, considering our objective to ${context}, we might want to rethink this."
3. "I appreciate your input. Can we pause for a moment to ensure we're addressing ${context} effectively?"`;
};

export const generatePhrase = async (context: string, intent: string) => {
    try {
        const response = await axios.post(`${API_URL}/ai/generate-phrase`, { context, intent });
        return response.data;
    } catch (error: any) {
        console.error("Phrase Generation Error Details:", {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url
        });

        // Return mock fallback instead of error message
        return getMockPhrases(context, intent);
    }
};
