import { useState, useEffect, type ReactElement } from 'react';
import { Box, Grid, Paper, Typography, Button, Chip, InputAdornment, TextField, Tabs, Tab, Card, CardContent, CardMedia, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Alert, useMediaQuery, useTheme, Skeleton, Accordion, AccordionSummary, AccordionDetails, Snackbar, IconButton } from '@mui/material';
import { Search, BookOpen, Lightbulb, ExternalLink, Sparkles, RefreshCw, TrendingUp, MessageSquare, Send, CheckCircle, AlertCircle, Quote, ThumbsUp, ThumbsDown, Zap, Book, Shield, ChevronDown, Copy, Wand2 } from 'lucide-react';
import axios from 'axios';
import { analyzeNews, generateGDTopics, explainTopic, generateKeyPoints, generateDebateMotion, evaluateArgument, getWordDefinition, generatePhrase } from '../services/ai';



const categories = ['All', 'Business', 'Technology', 'Politics', 'Health', 'Science'];
const dateFilters = ['Today', 'This Week', 'This Month'];

const categoryColors: Record<string, string> = {
    'Business': '#f59e0b',
    'Technology': '#3b82f6',
    'Politics': '#ef4444',
    'Health': '#10b981',
    'Science': '#8b5cf6',
    'Current Affairs': '#6366f1'
};



interface Article {
    title: string;
    description: string;
    url: string;
    urlToImage: string;
    source: { name: string };
    publishedAt: string;
    content?: string;
    category?: string;
}

interface ArticleWithInsights extends Article {
    keyPoints?: string;
    isAnalyzing?: boolean;
    gdRelevance?: string;
}

interface GDTopic {
    topic: string;
    context: string;
    explanation?: string;
    keyPoints?: string;
    isLoading?: boolean;
}

const ContentHub = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [query, setQuery] = useState('');
    const [topicQuery, setTopicQuery] = useState('');
    const [articles, setArticles] = useState<ArticleWithInsights[]>([]);
    const [gdTopics, setGdTopics] = useState<GDTopic[]>([]);
    const [selectedTab, setSelectedTab] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [dateFilter, setDateFilter] = useState('This Week');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [topicsLoading, setTopicsLoading] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<GDTopic | null>(null);
    const [showTopicDialog, setShowTopicDialog] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<ArticleWithInsights | null>(null);
    const [showArticleDialog, setShowArticleDialog] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Debate Practice State
    const [showDebateDialog, setShowDebateDialog] = useState(false);
    const [debateMotion, setDebateMotion] = useState('');
    const [debateArgument, setDebateArgument] = useState('');
    const [debateFeedback, setDebateFeedback] = useState<any>(null);
    const [isDebateLoading, setIsDebateLoading] = useState(false);

    const [dictionaryError, setDictionaryError] = useState('');
    const [dictionaryQuery, setDictionaryQuery] = useState('');
    const [wordData, setWordData] = useState<any>(null);
    const [isDictionaryLoading, setIsDictionaryLoading] = useState(false);

    // Phrase Generator State
    const [showPhraseGenDialog, setShowPhraseGenDialog] = useState(false);
    const [phraseIntent, setPhraseIntent] = useState('Professional');
    const [phraseContext, setPhraseContext] = useState('');
    const [generatedPhrase, setGeneratedPhrase] = useState('');
    const [isPhraseGenLoading, setIsPhraseGenLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // Power Vocabulary Categories
    const [selectedVocabCategory, setSelectedVocabCategory] = useState('All');

    // Categorized Vocab Data
    const vocabData: Record<string, string[]> = {
        'Impact Verbs': ['Articulate', 'Substantiate', 'Corroborate', 'Elucidate', 'Exemplify', 'Mitigate', 'Leverage', 'Reiterate'],
        'Transitions': ['Conversely', 'Furthermore', 'Notwithstanding', 'Albeit', 'Hitherto', 'Consequently', 'Simultaneously', 'Subsequently'],
        'Diplomacy': ['Consensus', 'Mediation', 'Viable', 'Feasible', 'Constructive', 'Inclusive', 'Pragmatic', 'Mutual'],
        'Abstract': ['Paradigm', 'Nuance', 'Holistic', 'Ambiguity', 'Dichotomy', 'Spectrum', 'Subjective', 'Objective'],
        'Ethics': ['Integrity', 'Transparency', 'Accountability', 'Empathy', 'Equity', 'Bias', 'Dilemma', 'Moral']
    };

    const getAllVocab = () => {
        const unique = new Set<string>();
        Object.values(vocabData).forEach(list => list.forEach(w => unique.add(w)));
        return Array.from(unique).sort(() => 0.5 - Math.random()).slice(0, 12);
    };

    const [vocabWords, setVocabWords] = useState<string[]>(getAllVocab());

    const handleVocabCategoryChange = (category: string) => {
        setSelectedVocabCategory(category);
        if (category === 'All') {
            setVocabWords(getAllVocab());
        } else {
            setVocabWords(vocabData[category] || []);
        }
    };

    const handleRefreshVocab = () => {
        if (selectedVocabCategory === 'All') {
            setVocabWords(getAllVocab());
        } else {
            // Shuffle specific category
            const words = [...(vocabData[selectedVocabCategory] || [])];
            setVocabWords(words.sort(() => 0.5 - Math.random()));
        }
    };

    const handleVocabClick = (word: string) => {
        setDictionaryQuery(word);
        // We need to trigger search, but since state update is async, we call search directly with the word
        // Or set a flag. Better to just reuse the logic or pass the word.
        // Let's refactor dictionary search to accept an argument.
        searchDictionary(word);
    };

    const parseMarkdown = (text: string): ReactElement[] => {
        if (!text) return [];

        const lines = text.split('\n');
        const elements: ReactElement[] = [];

        lines.forEach((line, index) => {
            // Support for bold text using splitted segments
            const parts = line.split(/(\*\*.*?\*\*)/g);
            const formattedLine = parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} style={{ color: theme.palette.primary.main }}>{part.slice(2, -2)}</strong>;
                }
                return part;
            });

            if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
                const cleanLine = line.replace(/^[•\-\*]\s*/, '');
                const cleanParts = cleanLine.split(/(\*\*.*?\*\*)/g);
                const cleanFormatted = cleanParts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} style={{ color: theme.palette.primary.main }}>{part.slice(2, -2)}</strong>;
                    }
                    return part;
                });

                elements.push(
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Typography sx={{ color: 'success.main', fontWeight: 'bold' }}>•</Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.8, fontSize: '0.95rem' }}>
                            {cleanFormatted}
                        </Typography>
                    </Box>
                );
            } else if (line.trim().match(/^\d+\./)) {
                elements.push(
                    <Typography key={index} variant="body2" sx={{ color: 'text.primary', lineHeight: 1.8, fontSize: '0.95rem', mb: 1 }}>
                        {formattedLine}
                    </Typography>
                );
            } else if (line.trim()) {
                elements.push(
                    <Typography key={index} variant="body2" sx={{ color: 'text.primary', lineHeight: 1.8, fontSize: '0.95rem', mb: 1.5 }}>
                        {formattedLine}
                    </Typography>
                );
            }
        });

        return elements;
    };


    const getDateRange = (filter: string) => {
        const toDate = new Date();
        let fromDate = new Date();

        if (filter === 'Today') {
            // fromDate is same as toDate
        } else if (filter === 'This Week') {
            fromDate.setDate(toDate.getDate() - 7);
        } else if (filter === 'This Month') {
            fromDate.setMonth(toDate.getMonth() - 1);
        }

        // Use local YYYY-MM-DD format to match user's perspective, not UTC
        const to = toDate.toLocaleDateString('en-CA');
        const from = fromDate.toLocaleDateString('en-CA');

        return { from, to };
    };

    const detectCategory = (article: Article): string => {
        const text = `${article.title} ${article.description}`.toLowerCase();
        if (text.includes('tech') || text.includes('ai') || text.includes('software') || text.includes('digital')) return 'Technology';
        if (text.includes('business') || text.includes('economy') || text.includes('market') || text.includes('finance')) return 'Business';
        if (text.includes('health') || text.includes('medical') || text.includes('disease') || text.includes('hospital')) return 'Health';
        if (text.includes('politics') || text.includes('government') || text.includes('election') || text.includes('policy')) return 'Politics';
        if (text.includes('science') || text.includes('research') || text.includes('study') || text.includes('discovery')) return 'Science';
        return 'Current Affairs';
    };

    const detectGDRelevance = (article: Article): string => {
        const text = `${article.title} ${article.description}`.toLowerCase();
        const keywords = ['debate', 'controversy', 'impact', 'policy', 'reform', 'crisis', 'framework', 'analysis', 'future', 'challenge', 'solution', 'global', 'economy', 'ai', 'climate'];
        if (keywords.some(k => text.includes(k))) return 'High';
        return 'Medium';
    };

    const searchNews = async (searchQuery = query, category = selectedCategory, pageNum = 1) => {
        setLoading(true);
        setError(null);
        console.log(`Searching news: query='${searchQuery}', category='${category}', page=${pageNum}, dateFilter='${dateFilter}'`);

        try {
            const { from, to } = getDateRange(dateFilter);
            const API_URL = import.meta.env.VITE_API_URL || '/api';

            // Build the URL based on strategy
            // Strategy: ALWAYS use 'everything' endpoint to support strict date filtering and deep pagination.
            let q = searchQuery.trim();

            // Logic: Include Category in query to ensure relevance if it's not "All"
            // If user searches "AI" and selects "Health", we want "AI AND Health"
            if (category !== 'All') {
                if (q) {
                    q += ` ${category}`;
                } else {
                    q = category;
                }
            } else if (!q) {
                // Default fallback if no query and no category
                q = 'news';
            }

            // Determine Sort Strategy based on Filter
            // User Request: "rank them on their relevance to GD and selected categories"
            // Strategy: Use 'relevancy' to let NewsAPI find the best keyword matches within the date range.
            // The Date Range (from/to) already strictly enforces "Today", "Week", etc.
            const backendSortBy = 'relevancy';

            // Determine if we should use 'top-headlines' or 'everything'
            let url = '';

            // If no specific query is typed, and we just want general news or specific category news,
            // 'top-headlines' is much better/reliable than 'everything?q=news'.
            if ((!searchQuery.trim() || searchQuery.trim() === 'news') && category !== 'All') {
                url = `${API_URL}/content/headlines?category=${category}&page=${pageNum}`;
            } else if (!searchQuery.trim() && category === 'All') {
                url = `${API_URL}/content/headlines?page=${pageNum}`;
            } else {
                // User typed a specific query -> Use Everything endpoint
                url = `${API_URL}/content/news?query=${encodeURIComponent(q)}&page=${pageNum}&from=${from}&to=${to}&sortBy=${backendSortBy}`;
            }

            console.log('Fetching URL:', url);
            const response = await axios.get(url);

            if (response.data.articles) {
                console.log(`Received ${response.data.articles.length} articles`);
                const newArticles = response.data.articles.map((article: Article) => ({
                    ...article,
                    keyPoints: undefined,
                    isAnalyzing: false,
                    category: detectCategory(article),
                    gdRelevance: detectGDRelevance(article)
                }));

                setArticles(prev => {
                    const baseArticles = pageNum === 1 ? [] : prev;

                    // Filter duplicates based on URL
                    const existingUrls = new Set(baseArticles.map(a => a.url));
                    const uniqueNewArticles = newArticles.filter((a: Article) => !existingUrls.has(a.url));

                    console.log(`Unique new articles: ${uniqueNewArticles.length}`);

                    const allArticles = [...baseArticles, ...uniqueNewArticles];

                    // Sort by relevance logic requested by user:
                    // 1. GD Relevance (High > Medium)
                    // 2. Freshness (Newest first)
                    return allArticles.sort((a: ArticleWithInsights, b: ArticleWithInsights) => {
                        // Primary Sort: GD Relevance
                        if (a.gdRelevance === 'High' && b.gdRelevance !== 'High') return -1;
                        if (a.gdRelevance !== 'High' && b.gdRelevance === 'High') return 1;

                        // Secondary Sort: Published Date (Newest First)
                        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
                    });
                });

                setHasMore(response.data.articles.length > 0);
            } else {
                if (pageNum === 1) setArticles([]);
                setHasMore(false);
            }

        } catch (error: any) {
            console.error('Error fetching news:', error);
            setError(error.message || 'Failed to fetch news');
        } finally {
            setLoading(false);
        }
    };


    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        searchNews(query, selectedCategory, nextPage);
    };

    const searchTopic = async (tQuery: string) => {
        // Reuse searchNews but force the query
        await searchNews(tQuery, 'All');
    };

    const searchDictionary = async (word: string) => {
        if (!word) return;
        setDictionaryQuery(word);
        setIsDictionaryLoading(true);
        setDictionaryError('');
        setWordData(null);
        try {
            const data = await getWordDefinition(word);
            setWordData(data);
        } catch (err) {
            setDictionaryError('Could not find definition.');
        } finally {
            setIsDictionaryLoading(false);
        }
    };

    const handleGeneratePhrase = async () => {
        if (!phraseContext.trim()) return;
        setIsPhraseGenLoading(true);
        try {
            const result = await generatePhrase(phraseIntent, phraseContext);
            setGeneratedPhrase(result);
        } catch (error) {
            console.error(error);
        } finally {
            setIsPhraseGenLoading(false);
        }
    };

    const handleCopyPhrase = (text: string) => {
        navigator.clipboard.writeText(text);
        setSnackbarMessage('Phrase copied to clipboard!');
        setSnackbarOpen(true);
    };

    const extractKeyPoints = async (index: number) => {
        const article = articles[index];
        if (!article.description && !article.content) {
            alert('No content available to analyze');
            return;
        }

        setSelectedArticle({ ...article, isAnalyzing: true });
        setShowArticleDialog(true);

        try {
            const content = article.content || article.description || '';
            console.log('Analyzing news content:', content.substring(0, 100) + '...');
            const keyPoints = await analyzeNews(content);
            console.log('AI Analysis Result:', keyPoints);

            const updatedArticle = {
                ...article,
                keyPoints: keyPoints || 'Unable to extract key points.',
                isAnalyzing: false
            };

            setArticles(prev => prev.map((a, i) => i === index ? updatedArticle : a));
            setSelectedArticle(updatedArticle);
        } catch (error) {
            console.error('Error extracting key points:', error);
            const errorArticle = {
                ...article,
                keyPoints: 'Error extracting key points. Please try again.',
                isAnalyzing: false
            };
            setArticles(prev => prev.map((a, i) => i === index ? errorArticle : a));
            setSelectedArticle(errorArticle);
        }
    };


    // New state for Topic Category
    const [topicCategory, setTopicCategory] = useState('Random');
    const topicCategories = ['Random', 'Current Affairs', 'Economics', 'Technology', 'Geopolitics', 'Social Issues', 'Abstract', 'Environment'];

    const loadGDTopics = async () => {
        setTopicsLoading(true);
        setGdTopics([]);

        try {
            const topics = await generateGDTopics(topicCategory);
            if (topics && topics.length > 0) {
                setGdTopics(topics);
            } else {
                setGdTopics([
                    { topic: 'Impact of AI on Employment', context: 'Exploring how artificial intelligence is reshaping the job market and creating new opportunities' },
                    { topic: 'Climate Change and Global Policy', context: 'Analyzing international efforts to combat climate change and sustainable development' },
                    { topic: 'Digital Privacy vs Security', context: 'Balancing personal privacy rights with national security needs in the digital age' }
                ]);
            }
        } catch (error) {
            console.error('Error loading topics:', error);
            setGdTopics([
                { topic: 'Impact of AI on Employment', context: 'Exploring how artificial intelligence is reshaping the job market' },
                { topic: 'Climate Change and Global Policy', context: 'Analyzing international efforts to combat climate change' }
            ]);
        } finally {
            setTopicsLoading(false);
        }
    };

    const handleDebate = async (article: ArticleWithInsights) => {
        setDebateMotion('');
        setDebateArgument('');
        setDebateFeedback(null);
        setShowDebateDialog(true);
        setIsDebateLoading(true);

        try {
            const content = article.content || article.description || article.title;
            const motion = await generateDebateMotion(content);
            setDebateMotion(motion);
        } catch (error) {
            console.error('Error generating motion:', error);
            setDebateMotion('This house believes that the topic discussed in the article is significant.');
        } finally {
            setIsDebateLoading(false);
        }
    };

    const handleSubmitArgument = async () => {
        if (!debateArgument.trim()) return;

        setIsDebateLoading(true);
        try {
            const feedback = await evaluateArgument(debateMotion, debateArgument);
            setDebateFeedback(feedback);
        } catch (error) {
            console.error('Error evaluating argument:', error);
        } finally {
            setIsDebateLoading(false);
        }
    };

    const handleUnderstandTopic = async (topic: GDTopic) => {
        setSelectedTopic({ ...topic, isLoading: true });
        setShowTopicDialog(true);

        try {
            console.log('Understanding topic:', topic.topic);
            const explanation = await explainTopic(topic.topic);
            const keyPoints = await generateKeyPoints(topic.topic);
            console.log('Topic AI Results - Explanation:', explanation?.substring(0, 100));
            console.log('Topic AI Results - Key Points:', keyPoints?.substring(0, 100));

            setSelectedTopic(prev => prev ? {
                ...prev,
                explanation,
                keyPoints,
                isLoading: false
            } : null);
        } catch (error) {
            console.error('Error analyzing topic:', error);
            setSelectedTopic(prev => prev ? { ...prev, isLoading: false } : null);
        }
    };



    useEffect(() => {
        if (selectedTab === 0) {
            setPage(1);
            searchNews(query, selectedCategory, 1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, dateFilter]);

    return (
        <Box sx={{ px: { xs: 2, md: 0 } }}>
            <Box sx={{ mb: { xs: 3, md: 4 } }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'text.primary', fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
                    Knowledge Hub 📚
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
                    Stay updated with GD-relevant news and AI-generated topics
                </Typography>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: { xs: 2, md: 3 } }}>
                <Tabs
                    value={selectedTab}
                    onChange={(_, v) => setSelectedTab(v)}
                    variant={isMobile ? "scrollable" : "standard"}
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                >
                    <Tab label="Latest News" sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', md: '0.95rem' }, minWidth: { xs: 'auto', md: 160 } }} />
                    <Tab label={isMobile ? "AI Topics" : "AI-Generated GD Topics"} sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', md: '0.95rem' }, minWidth: { xs: 'auto', md: 160 } }} />
                    <Tab label={isMobile ? "Search" : "Topic Search"} sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', md: '0.95rem' }, minWidth: { xs: 'auto', md: 160 } }} />
                    <Tab label={isMobile ? "Toolkit" : "Prep Toolkit"} iconPosition="start" icon={<Book size={18} />} sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', md: '0.95rem' }, minWidth: { xs: 'auto', md: 160 } }} />
                </Tabs>
            </Box>

            {selectedTab === 0 && (
                <>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, md: 3 },
                            mb: { xs: 3, md: 4 },
                            borderRadius: 4,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            // backdropFilter: 'blur(12px)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                        }}
                    >
                        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="center">
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    placeholder="Search global news..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && searchNews()}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search size={20} className="text-gray-400" />
                                            </InputAdornment>
                                        ),
                                        sx: { borderRadius: 3, bgcolor: 'background.paper' }
                                    }}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={6} md={2}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        label="Category"
                                        sx={{ borderRadius: 3, bgcolor: 'background.paper' }}
                                    >
                                        {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6} md={2}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Date</InputLabel>
                                    <Select
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                        label="Date"
                                        sx={{ borderRadius: 3, bgcolor: 'background.paper' }}
                                    >
                                        {dateFilters.map(filter => <MenuItem key={filter} value={filter}>{filter}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={() => searchNews()}
                                    disabled={loading}
                                    sx={{
                                        height: 40,
                                        borderRadius: 3,
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        boxShadow: 'none',
                                        '&:hover': { boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }
                                    }}
                                >
                                    {loading ? 'Searching...' : 'Search'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>

                    {loading ? (
                        <Grid container spacing={{ xs: 2, md: 3 }}>
                            {[1, 2, 3, 4, 5, 6].map((item) => (
                                <Grid item xs={12} sm={6} lg={4} key={item}>
                                    <Card elevation={0} sx={{ height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                        <Skeleton variant="rectangular" height={180} />
                                        <CardContent>
                                            <Skeleton width="60%" height={24} sx={{ mb: 1 }} />
                                            <Skeleton width="40%" height={16} sx={{ mb: 2 }} />
                                            <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                                            <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                                            <Skeleton variant="text" sx={{ fontSize: '1rem', width: '80%' }} />
                                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                                <Skeleton width={80} height={32} />
                                                <Skeleton width={80} height={32} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <>
                            {error && (
                                <Alert severity="error" sx={{ mb: 3 }}>
                                    {error}
                                </Alert>
                            )}

                            {!error && articles.length === 0 && (
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    No articles found. Try adjusting your search criteria.
                                </Alert>
                            )}

                            <Grid container spacing={{ xs: 2, md: 3 }}>
                                {articles.map((article, index) => (
                                    <Grid item xs={12} sm={6} lg={4} key={index} className="animate-fade-in" sx={{ animationDelay: `${index * 50}ms` }}>
                                        <Card elevation={0} sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderRadius: 4,
                                            overflow: 'hidden',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            transition: 'all 0.3s ease',
                                            bgcolor: 'background.paper',
                                            '&:hover': {
                                                transform: 'translateY(-6px)',
                                                boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
                                                borderColor: 'primary.light'
                                            }
                                        }}>
                                            {article.urlToImage && (
                                                <Box sx={{ position: 'relative', pt: '56.25%', overflow: 'hidden' }}>
                                                    <CardMedia
                                                        component="img"
                                                        image={article.urlToImage}
                                                        alt={article.title}
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            transition: 'transform 0.5s ease',
                                                            '&:hover': { transform: 'scale(1.05)' }
                                                        }}
                                                    />
                                                    <Box sx={{
                                                        position: 'absolute',
                                                        top: 12,
                                                        left: 12,
                                                        display: 'flex',
                                                        gap: 1
                                                    }}>
                                                        <Chip
                                                            label={article.category}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: 'rgba(255, 255, 255, 0.95)',
                                                                color: categoryColors[article.category || 'Current Affairs'], // Colored text
                                                                fontWeight: 700,
                                                                fontSize: '0.7rem',
                                                                backdropFilter: 'blur(4px)',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            )}
                                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {new Date(article.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    <span>•</span>
                                                    {article.source.name}
                                                </Typography>

                                                <Typography variant="h6" fontWeight="bold" sx={{
                                                    mb: 1.5,
                                                    lineHeight: 1.3,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    color: 'text.primary',
                                                    fontSize: { xs: '1rem', md: '1.125rem' }
                                                }}>
                                                    {article.title}
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary" sx={{
                                                    mb: 3,
                                                    flexGrow: 1,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    fontSize: '0.875rem',
                                                    lineHeight: 1.6
                                                }}>
                                                    {article.description || 'No description available for this article.'}
                                                </Typography>

                                                <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                                                    <Button
                                                        fullWidth
                                                        variant="outlined"
                                                        startIcon={<Lightbulb size={16} />}
                                                        onClick={() => extractKeyPoints(index)}
                                                        disabled={article.isAnalyzing}
                                                        color="primary"
                                                        sx={{
                                                            borderRadius: 2.5,
                                                            fontWeight: 600,
                                                            fontSize: '0.8125rem',
                                                            textTransform: 'none',
                                                            borderWidth: '2px',
                                                            '&:hover': { borderWidth: '2px' }
                                                        }}
                                                    >
                                                        {article.isAnalyzing ? 'Analyzing with AI...' : 'Get AI Insights'}
                                                    </Button>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>

                            {hasMore && articles.length > 0 && !loading && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={handleLoadMore}
                                        sx={{
                                            borderRadius: 2,
                                            px: 4,
                                            py: 1,
                                            borderWidth: 2,
                                            '&:hover': { borderWidth: 2 }
                                        }}
                                    >
                                        Load More News
                                    </Button>
                                </Box>
                            )}

                            {loading && page > 1 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                    <CircularProgress />
                                </Box>
                            )}
                        </>
                    )}
                </>
            )
            }

            {
                selectedTab === 1 && (
                    <>
                        <Box sx={{ mb: { xs: 2, md: 3 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary', fontSize: { xs: '1rem', md: '1.25rem' } }}>
                                {isMobile ? "AI-Generated Topics" : "AI-Generated GD Topics Based on Current Affairs"}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>Generate For</InputLabel>
                                    <Select
                                        value={topicCategory}
                                        label="Generate For"
                                        onChange={(e) => setTopicCategory(e.target.value)}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        {topicCategories.map((cat) => (
                                            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Button
                                    variant="outlined"
                                    startIcon={topicsLoading ? <CircularProgress size={18} /> : <RefreshCw size={18} />}
                                    onClick={loadGDTopics}
                                    disabled={topicsLoading}
                                    sx={{ borderRadius: 2, fontWeight: 600, fontSize: { xs: '0.85rem', md: '1rem' } }}
                                >
                                    {topicsLoading ? 'Generating...' : (isMobile ? 'Refresh' : 'Generate Topics')}
                                </Button>
                            </Box>
                        </Box>

                        {gdTopics.length === 0 && !topicsLoading && (
                            <Alert severity="info" sx={{ mb: 3 }}>
                                Click "Refresh Topics" to generate AI-powered GD topics
                            </Alert>
                        )}

                        <Grid container spacing={{ xs: 2, md: 3 }}>
                            {gdTopics.map((topic, index) => (
                                <Grid item xs={12} md={6} key={index}>
                                    <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: '2px solid', borderColor: 'primary.light', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 16px rgba(0,0,0,0.08)' } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1.5, md: 2 }, mb: 2 }}>
                                            <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, color: 'primary.main' }}>
                                                <Sparkles size={24} />
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'text.primary', fontSize: { xs: '1rem', md: '1.25rem' } }}>
                                                    {topic.topic}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', md: '0.9rem' } }}>
                                                    {topic.context}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                startIcon={<Lightbulb size={16} />}
                                                onClick={() => handleUnderstandTopic(topic)}
                                                sx={{ borderRadius: 2, fontWeight: 600, fontSize: { xs: '0.85rem', md: '1rem' } }}
                                            >
                                                Analyze with AI
                                            </Button>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )
            }

            {
                selectedTab === 2 && (
                    <Box>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 3, md: 4 },
                                mb: { xs: 3, md: 4 },
                                borderRadius: 4,
                                border: '1px solid',
                                borderColor: 'divider',
                                textAlign: 'center',
                                bgcolor: 'background.paper',
                                // backdropFilter: 'blur(12px)',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                            }}
                        >
                            <TrendingUp size={48} className="text-gray-300" style={{ marginBottom: 16 }} />
                            <Typography variant="h6" sx={{ mb: 1, color: 'text.primary', fontSize: { xs: '1.1rem', md: '1.25rem' }, fontWeight: 700 }}>
                                Explore Any Topic
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 3, fontSize: { xs: '0.85rem', md: '0.95rem' } }}>
                                Enter a topic to generate AI insights and find relevant articles for your group discussion
                            </Typography>

                            <Box sx={{ maxWidth: 600, mx: 'auto', display: 'flex', gap: 1 }}>
                                <TextField
                                    fullWidth
                                    placeholder="e.g., Artificial Intelligence in Healthcare"
                                    value={topicQuery}
                                    onChange={(e) => setTopicQuery(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && topicQuery.trim()) {
                                            searchTopic(topicQuery);
                                        }
                                    }}
                                    variant="outlined"
                                    sx={{
                                        bgcolor: 'background.paper',
                                        borderRadius: 2,
                                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => topicQuery.trim() && searchTopic(topicQuery)}
                                    disabled={loading || !topicQuery.trim()}
                                    sx={{
                                        borderRadius: 2,
                                        fontWeight: 600,
                                        fontSize: { xs: '0.9rem', md: '1rem' },
                                        px: 4,
                                        boxShadow: 'none'
                                    }}
                                >
                                    {loading ? 'Searching...' : 'Search'}
                                </Button>
                            </Box>
                        </Paper>

                        {loading ? (
                            <Grid container spacing={{ xs: 2, md: 3 }}>
                                {[1, 2, 3].map((item) => (
                                    <Grid item xs={12} sm={6} lg={4} key={item}>
                                        <Card elevation={0} sx={{ height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                            <Skeleton variant="rectangular" height={180} />
                                            <CardContent>
                                                <Skeleton width="60%" height={24} sx={{ mb: 1 }} />
                                                <Skeleton width="40%" height={16} sx={{ mb: 2 }} />
                                                <Skeleton variant="text" />
                                                <Skeleton variant="text" />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <>
                                {articles.length > 0 && (
                                    <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mt: { xs: 1, md: 2 } }}>
                                        {articles.map((article, index) => (
                                            <Grid item xs={12} sm={6} lg={4} key={index} className="animate-fade-in" sx={{ animationDelay: `${index * 50}ms` }}>
                                                <Card elevation={0} sx={{
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    borderRadius: 4,
                                                    overflow: 'hidden',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    transition: 'all 0.3s ease',
                                                    bgcolor: 'background.paper',
                                                    '&:hover': {
                                                        transform: 'translateY(-6px)',
                                                        boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.12)',
                                                        borderColor: 'primary.light'
                                                    }
                                                }}>
                                                    {article.urlToImage && (
                                                        <Box sx={{ position: 'relative', pt: '56.25%', overflow: 'hidden' }}>
                                                            <CardMedia component="img" image={article.urlToImage} alt={article.title} sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
                                                                <Chip label={article.category} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.95)', color: categoryColors[article.category || 'Current Affairs'], fontWeight: 700, fontSize: '0.7rem' }} />
                                                            </Box>
                                                        </Box>
                                                    )}
                                                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                                                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5, lineHeight: 1.3, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                                                            {article.title}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1, fontSize: '0.875rem', lineHeight: 1.6 }}>
                                                            {article.description?.substring(0, 120)}...
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                                                            <Button
                                                                variant="outlined"
                                                                startIcon={<Lightbulb size={16} />}
                                                                onClick={() => extractKeyPoints(index)}
                                                                disabled={article.isAnalyzing}
                                                                sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600, fontSize: '0.8125rem' }}
                                                            >
                                                                {article.isAnalyzing ? 'Analyzing...' : 'Insights'}
                                                            </Button>
                                                            <Button
                                                                variant="outlined"
                                                                color="secondary"
                                                                startIcon={<MessageSquare size={16} />}
                                                                onClick={() => handleDebate(article)}
                                                                sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600, fontSize: '0.8125rem' }}
                                                            >
                                                                Debate
                                                            </Button>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                )}
                            </>
                        )}
                    </Box>
                )
            }

            {
                selectedTab === 3 && (
                    <Box className="animate-fade-in">
                        <Box sx={{ mb: 4, textAlign: 'center' }}>
                            <Typography variant="h5" fontWeight="bold" sx={{ mb: 1, color: 'text.primary' }}>GD Preparation Toolkit</Typography>
                            <Typography color="text.secondary">Essential tools and phrases to master your group discussion skills</Typography>
                        </Box>

                        {/* AI Smart Dictionary */}
                        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: 4, border: '1px solid', borderColor: 'primary.light', bgcolor: 'background.paper' }}>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1, width: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: 2, color: 'white' }}>
                                            <Book size={24} />
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold">AI Smart Dictionary</Typography>
                                            <Typography variant="body2" color="text.secondary">Get definitions & professional usage examples</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <TextField
                                                fullWidth
                                                placeholder="Enter a word (e.g., Mitigate)"
                                                value={dictionaryQuery}
                                                onChange={(e) => setDictionaryQuery(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && searchDictionary(dictionaryQuery)}
                                                variant="outlined"
                                                error={!!dictionaryError}
                                                sx={{ bgcolor: 'background.paper', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                            />
                                            <Button
                                                variant="contained"
                                                onClick={() => searchDictionary(dictionaryQuery)}
                                                disabled={isDictionaryLoading || !dictionaryQuery.trim()}
                                                sx={{ borderRadius: 2, px: 3, fontWeight: 600, boxShadow: 'none' }}
                                            >
                                                {isDictionaryLoading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
                                            </Button>
                                        </Box>
                                        {dictionaryError && (
                                            <Typography variant="caption" color="error" sx={{ ml: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <AlertCircle size={14} /> {dictionaryError}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>

                                {wordData && (
                                    <Box sx={{ flex: 1, width: '100%', bgcolor: 'background.paper', p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="h5" fontWeight="bold" sx={{ color: 'primary.main', mb: 1, textTransform: 'capitalize' }}>
                                            {dictionaryQuery}
                                        </Typography>
                                        <Typography variant="body1" sx={{ mb: 2, color: 'text.primary' }}>
                                            {wordData.definition}
                                        </Typography>

                                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', mb: 1 }}>Power Synonyms</Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                                            {wordData.synonyms?.map((syn: string, i: number) => (
                                                <Chip key={i} label={syn} size="small" sx={{ bgcolor: 'primary.light', color: 'primary.main', fontWeight: 600 }} />
                                            ))}
                                        </Box>

                                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', mb: 1 }}>Usage in Group Discussion</Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {wordData.examples?.map((ex: string, i: number) => (
                                                <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                                    <Box sx={{ mt: 0.8, width: 4, height: 4, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0 }} />
                                                    <Typography variant="body2" sx={{ fontSize: '0.9rem', color: 'text.secondary', fontStyle: 'italic' }}>"{ex}"</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Paper>

                        <Grid container spacing={4}>
                            {/* Phrase Bank */}
                            <Grid item xs={12} md={6}>
                                <Paper elevation={0} sx={{ p: 3, minHeight: '100%', borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: 2, color: 'white' }}>
                                                <Quote size={24} />
                                            </Box>
                                            <Typography variant="h6" fontWeight="bold">Phrase Bank</Typography>
                                        </Box>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<Wand2 size={16} />}
                                            onClick={() => setShowPhraseGenDialog(true)}
                                            sx={{ borderRadius: 2, textTransform: 'none' }}
                                        >
                                            AI Assistant
                                        </Button>
                                    </Box>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {[
                                            {
                                                label: 'Initiating',
                                                color: 'primary.main',
                                                bgcolor: 'primary.50',
                                                phrases: [
                                                    "I'd like to initiate the discussion by stating that this topic is crucial because it directly impacts our collective future.",
                                                    "To set the context for today's topic, we must consider the historical background and current trends affecting this issue.",
                                                    "Looking at the topic from a global perspective, one can observe significant shifts in how this is perceived across different nations."
                                                ]
                                            },
                                            {
                                                label: 'Agreeing & Adding',
                                                color: 'secondary.main',
                                                bgcolor: 'secondary.50',
                                                phrases: [
                                                    "I resonate with your point and would like to add that recent studies further support this argument.",
                                                    "Building on what you just said, I also believe we should consider the long-term implications of such a decision.",
                                                    "That's a valid observation. Furthermore, we can see examples of this success in several developing economies."
                                                ]
                                            },
                                            {
                                                label: 'Politely Disagreeing',
                                                color: 'error.main',
                                                bgcolor: 'error.50',
                                                phrases: [
                                                    "I see your point, but looking at it differently, one could argue that the costs might outweigh the benefits in the short run.",
                                                    "While that's true in some cases, isn't it also true that unique local factors often lead to different outcomes?",
                                                    "I beg to differ on that specific aspect because the data suggests a contrary trend in the last fiscal quarter."
                                                ]
                                            },
                                            {
                                                label: 'Interrupting Politely',
                                                color: 'warning.main',
                                                bgcolor: 'warning.50',
                                                phrases: [
                                                    "Sorry to interrupt, but I'd like to briefly add a crucial point that connects to what was just said.",
                                                    "If I may interject for a moment, I believe there's another angle we haven't considered yet.",
                                                    "Excuse me, allow me to just quickly clarify this specific detail before we move on."
                                                ]
                                            },
                                            {
                                                label: 'Summarizing & Concluding',
                                                color: 'success.main',
                                                bgcolor: 'success.50',
                                                phrases: [
                                                    "In conclusion, while we have diverse opinions, the consensus leans towards a more sustainable approach.",
                                                    "Wrapping up, it's clear that immediate action is required in these key areas we've identified."
                                                ]
                                            },
                                            {
                                                label: 'Seeking Clarification',
                                                color: 'info.main',
                                                bgcolor: 'info.50',
                                                phrases: [
                                                    "Could you elaborate on how exactly that would impact the broader economic framework?",
                                                    "Am I correct in understanding that your primary concern rests on the implementation challenges?",
                                                    "I'd like to clarity one specific detail regarding the timeline you mentioned."
                                                ]
                                            },
                                            {
                                                label: 'Redirecting Topic',
                                                color: 'primary.dark',
                                                bgcolor: 'background.paper',
                                                phrases: [
                                                    "That is an interesting point, but let's bring the focus back to the core issue of sustainability.",
                                                    "While relevant, we might want to steer the discussion back towards our primary objective.",
                                                    "Let's not digress too far; returning to the motion, we need to address the immediate impact."
                                                ]
                                            }
                                        ].map((section, idx) => (
                                            <Accordion key={idx} disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', '&:before': { display: 'none' }, mb: 1 }}>
                                                <AccordionSummary expandIcon={<ChevronDown size={20} />} sx={{ bgcolor: section.bgcolor, borderRadius: '12px' }}>
                                                    <Typography variant="subtitle2" sx={{ color: section.color, fontWeight: 700, textTransform: 'uppercase' }}>{section.label}</Typography>
                                                </AccordionSummary>
                                                <AccordionDetails sx={{ pt: 2, pb: 3 }}>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                        {section.phrases.map((phrase, i) => (
                                                            <Box
                                                                key={i}
                                                                sx={{
                                                                    p: 2,
                                                                    bgcolor: 'action.hover',
                                                                    borderRadius: 2,
                                                                    border: '1px solid',
                                                                    borderColor: 'grey.100',
                                                                    width: '100%',
                                                                    position: 'relative',
                                                                    transition: 'all 0.2s',
                                                                    '&:hover': {
                                                                        bgcolor: 'background.paper',
                                                                        borderColor: 'primary.light',
                                                                        '& .copy-btn': { opacity: 1 }
                                                                    }
                                                                }}
                                                            >
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        fontSize: '0.95rem',
                                                                        lineHeight: 1.6,
                                                                        whiteSpace: 'pre-line',
                                                                        wordBreak: 'break-word',
                                                                        color: 'text.primary',
                                                                        pr: 4 // Make space for copy button
                                                                    }}
                                                                >
                                                                    {phrase}
                                                                </Typography>
                                                                <IconButton
                                                                    className="copy-btn"
                                                                    size="small"
                                                                    onClick={() => handleCopyPhrase(phrase)}
                                                                    sx={{
                                                                        position: 'absolute',
                                                                        top: '50%',
                                                                        right: 8,
                                                                        transform: 'translateY(-50%)',
                                                                        opacity: 0,
                                                                        transition: 'opacity 0.2s',
                                                                        color: 'text.secondary',
                                                                        '&:hover': { color: 'primary.main', bgcolor: 'primary.50' }
                                                                    }}
                                                                >
                                                                    <Copy size={16} />
                                                                </IconButton>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                </AccordionDetails>
                                            </Accordion>
                                        ))}
                                    </Box>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Grid container spacing={3}>
                                    {/* Power Vocabulary */}
                                    {/* Power Vocabulary */}
                                    <Grid item xs={12}>
                                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Box sx={{ p: 1, bgcolor: 'warning.main', borderRadius: 2, color: 'white' }}>
                                                        <Zap size={24} />
                                                    </Box>
                                                    <Typography variant="h6" fontWeight="bold">Power Vocabulary</Typography>
                                                </Box>
                                                <IconButton size="small" onClick={handleRefreshVocab} sx={{ bgcolor: 'action.hover' }}>
                                                    <RefreshCw size={16} />
                                                </IconButton>
                                            </Box>

                                            {/* Categories */}
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                                {['All', ...Object.keys(vocabData)].map((cat) => (
                                                    <Chip
                                                        key={cat}
                                                        label={cat}
                                                        size="small"
                                                        onClick={() => handleVocabCategoryChange(cat)}
                                                        color={selectedVocabCategory === cat ? 'warning' : 'default'}
                                                        variant={selectedVocabCategory === cat ? 'filled' : 'outlined'}
                                                        sx={{ fontWeight: 600, cursor: 'pointer' }}
                                                    />
                                                ))}
                                            </Box>

                                            <Grid container spacing={1.5}>
                                                {vocabWords.map((word, i) => (
                                                    <Grid item xs={6} sm={4} key={i}>
                                                        <Box
                                                            onClick={() => handleVocabClick(word)}
                                                            sx={{
                                                                p: 1.5,
                                                                textAlign: 'center',
                                                                bgcolor: 'warning.light',
                                                                color: '#0f172a', // Dark slate/black for high contrast 
                                                                borderRadius: 2,
                                                                fontWeight: 700,
                                                                fontSize: '0.95rem',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                                '&:hover': {
                                                                    bgcolor: 'warning.main',
                                                                    color: '#fff',
                                                                    transform: 'translateY(-2px)',
                                                                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                                                }
                                                            }}
                                                        >
                                                            {word}
                                                        </Box>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Paper>
                                    </Grid>

                                    {/* Do's and Don'ts */}
                                    <Grid item xs={12}>
                                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                                <Box sx={{ p: 1, bgcolor: 'success.main', borderRadius: 2, color: 'white' }}>
                                                    <Shield size={24} />
                                                </Box>
                                                <Typography variant="h6" fontWeight="bold">Do's & Don'ts</Typography>
                                            </Box>
                                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, color: 'success.main' }}>
                                                        <ThumbsUp size={16} />
                                                        <Typography variant="subtitle2" fontWeight="bold">Do's</Typography>
                                                    </Box>
                                                    <Box component="ul" sx={{ pl: 2, m: 0, '& li': { mb: 0.5, fontSize: '0.85rem', color: 'text.secondary' } }}>
                                                        <li>Maintain eye contact</li>
                                                        <li>Listen actively</li>
                                                        <li>Use accurate data</li>
                                                        <li>Be confident & calm</li>
                                                    </Box>
                                                </Box>
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, color: 'error.main' }}>
                                                        <ThumbsDown size={16} />
                                                        <Typography variant="subtitle2" fontWeight="bold">Don'ts</Typography>
                                                    </Box>
                                                    <Box component="ul" sx={{ pl: 2, m: 0, '& li': { mb: 0.5, fontSize: '0.85rem', color: 'text.secondary' } }}>
                                                        <li>Interrupt aggressively</li>
                                                        <li>Dominate the floor</li>
                                                        <li>Get emotional</li>
                                                        <li>Use vague arguments</li>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Box>
                )
            }

            <Dialog
                open={showArticleDialog}
                onClose={() => setShowArticleDialog(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4 } }}
            >
                <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1.5, bgcolor: 'success.light', borderRadius: 2, display: 'flex' }}>
                            <Lightbulb size={24} color="#16a34a" />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary', lineHeight: 1.2, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                                AI Analysis: Key Points
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {selectedArticle?.category} • GD Relevance: {selectedArticle?.gdRelevance}
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ pt: 3 }}>
                    {selectedArticle?.isAnalyzing ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <CircularProgress size={48} />
                            <Typography sx={{ mt: 3, color: 'text.primary', fontSize: '1rem', fontWeight: 500 }}>
                                Analyzing article with AI...
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Extracting key discussion points
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: 'text.primary' }}>
                                    Article Title
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6 }}>
                                    {selectedArticle?.title}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: 'text.primary' }}>
                                    Key Discussion Points
                                </Typography>
                                <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default', borderRadius: 3, border: '2px solid #86efac' }}>
                                    {selectedArticle?.keyPoints && parseMarkdown(selectedArticle.keyPoints)}
                                </Paper>
                            </Box>

                            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid #bfdbfe' }}>
                                <Typography variant="caption" sx={{ color: '#1e40af', fontSize: '0.85rem', lineHeight: 1.6 }}>
                                    💡 <strong>Tip:</strong> Use these points to prepare for group discussions. Consider different perspectives and real-world examples.
                                </Typography>
                            </Box>
                        </>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Button onClick={() => setShowArticleDialog(false)} variant="outlined" sx={{ fontWeight: 600, borderRadius: 2, px: 3, width: { xs: '100%', sm: 'auto' } }}>
                        Close
                    </Button>
                    {!selectedArticle?.isAnalyzing && selectedArticle?.url && (
                        <Button
                            variant="contained"
                            component="a"
                            href={selectedArticle.url}
                            target="_blank"
                            endIcon={<ExternalLink size={16} />}
                            sx={{ fontWeight: 600, borderRadius: 2, px: 3, width: { xs: '100%', sm: 'auto' } }}
                        >
                            Read Full Article
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <Dialog
                open={showTopicDialog}
                onClose={() => setShowTopicDialog(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4, maxHeight: '90vh' } }}
            >
                <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1.5, bgcolor: 'primary.light', borderRadius: 2, display: 'flex' }}>
                                <Sparkles size={24} color="#3b82f6" />
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary', lineHeight: 1.2, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                                    {selectedTopic?.topic}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                    AI-Generated Analysis
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ pt: 3 }}>
                    {selectedTopic?.isLoading ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <CircularProgress size={48} />
                            <Typography sx={{ mt: 3, color: 'text.primary', fontSize: '1rem', fontWeight: 500 }}>
                                Analyzing topic with AI...
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                This may take a few moments
                            </Typography>
                        </Box>
                    ) : (
                        <Box>
                            <Box sx={{ mb: 3, p: 2.5, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <BookOpen size={18} color="#64748b" />
                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'text.primary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Context
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                                    {selectedTopic?.context}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Box sx={{ width: 4, height: 24, bgcolor: 'primary.main', borderRadius: 1 }} />
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                                        Understanding the Topic
                                    </Typography>
                                </Box>
                                <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid #e0e0e0' }}>
                                    {selectedTopic?.explanation && parseMarkdown(selectedTopic.explanation)}
                                </Paper>
                            </Box>

                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Box sx={{ width: 4, height: 24, bgcolor: 'success.main', borderRadius: 1 }} />
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                                        Key Discussion Points
                                    </Typography>
                                </Box>
                                <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default', borderRadius: 3, border: '2px solid #86efac', boxShadow: '0 2px 8px rgba(134, 239, 172, 0.1)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <Lightbulb size={18} color="#16a34a" />
                                        <Typography variant="caption" fontWeight="bold" sx={{ color: '#16a34a', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            For Group Discussion
                                        </Typography>
                                    </Box>
                                    {selectedTopic?.keyPoints && parseMarkdown(selectedTopic.keyPoints)}
                                </Paper>
                            </Box>

                            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid #bfdbfe' }}>
                                <Typography variant="caption" sx={{ color: '#1e40af', fontSize: '0.85rem', lineHeight: 1.6 }}>
                                    💡 <strong>Tip:</strong> Use these points as a foundation for your discussion. Consider multiple perspectives and real-world examples to strengthen your arguments.
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Button onClick={() => setShowTopicDialog(false)} variant="outlined" sx={{ fontWeight: 600, borderRadius: 2, px: 3, width: { xs: '100%', sm: 'auto' } }}>
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        sx={{ fontWeight: 600, borderRadius: 2, px: 3, width: { xs: '100%', sm: 'auto' } }}
                        onClick={() => {
                            const content = `Topic: ${selectedTopic?.topic}\n\nContext: ${selectedTopic?.context}\n\nExplanation:\n${selectedTopic?.explanation}\n\nKey Points:\n${selectedTopic?.keyPoints}`;
                            navigator.clipboard.writeText(content);
                        }}
                    >
                        Copy Analysis
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Debate Practice Dialog */}
            <Dialog
                open={showDebateDialog}
                onClose={() => setShowDebateDialog(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4 } }}
            >
                <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1.5, bgcolor: 'secondary.light', borderRadius: 2, display: 'flex' }}>
                            <MessageSquare size={24} color="#9333ea" />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                                Debate Practice
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Sharpen your argumentation skills
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ pt: 3 }}>
                    {isDebateLoading && !debateMotion ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <CircularProgress size={48} color="secondary" />
                            <Typography sx={{ mt: 3, fontWeight: 500 }}>Generating a controversial motion...</Typography>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid #d8b4fe' }}>
                                <Typography variant="subtitle2" color="secondary.main" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1, fontWeight: 700 }}>
                                    The Motion
                                </Typography>
                                <Typography variant="h5" fontWeight="bold" sx={{ color: '#581c87', fontStyle: 'italic' }}>
                                    "{debateMotion}"
                                </Typography>
                            </Box>

                            {!debateFeedback ? (
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        Your Argument
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Are you For or Against? Make your case in 2-3 sentences.
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        placeholder="I believe that..."
                                        value={debateArgument}
                                        onChange={(e) => setDebateArgument(e.target.value)}
                                        variant="outlined"
                                        sx={{ mb: 3 }}
                                    />
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        size="large"
                                        endIcon={isDebateLoading ? <CircularProgress size={20} color="inherit" /> : <Send size={20} />}
                                        onClick={handleSubmitArgument}
                                        disabled={isDebateLoading || !debateArgument.trim()}
                                        fullWidth
                                    >
                                        {isDebateLoading ? 'Evaluating...' : 'Submit Argument'}
                                    </Button>
                                </Box>
                            ) : (
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                        <CircularProgress
                                            variant="determinate"
                                            value={debateFeedback.score * 10}
                                            color={debateFeedback.score >= 7 ? 'success' : debateFeedback.score >= 4 ? 'warning' : 'error'}
                                            size={60}
                                            thickness={4}
                                        />
                                        <Box>
                                            <Typography variant="h4" fontWeight="bold">
                                                {debateFeedback.score}/10
                                            </Typography>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Argument Strength: <strong>{debateFeedback.strength}</strong>
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'action.hover', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                                            <CheckCircle size={20} color="#16a34a" style={{ marginTop: 2 }} />
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Feedback</Typography>
                                                <Typography variant="body2" color="text.secondary">{debateFeedback.feedback}</Typography>
                                            </Box>
                                        </Box>
                                    </Paper>

                                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid #ffedd5', borderRadius: 2 }}>
                                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                                            <AlertCircle size={20} color="#ea580c" style={{ marginTop: 2 }} />
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: '#9a3412' }}>How to Improve</Typography>
                                                <Typography variant="body2" sx={{ color: '#9a3412' }}>{debateFeedback.improvement}</Typography>
                                            </Box>
                                        </Box>
                                    </Paper>

                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        onClick={() => {
                                            setDebateFeedback(null);
                                            setDebateArgument('');
                                        }}
                                        fullWidth
                                        sx={{ mt: 3 }}
                                    >
                                        Try Another Argument
                                    </Button>
                                </Box>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setShowDebateDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* AI Phrase Generator Dialog */}
            <Dialog
                open={showPhraseGenDialog}
                onClose={() => setShowPhraseGenDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4 } }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, color: 'primary.main' }}>
                        <Wand2 size={24} />
                    </Box>
                    <Typography variant="h6" fontWeight="bold">AI Phrase Assistant</Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Can't find the right words? Describe the situation and I'll generate a professional phrase for you.
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                        {['Disagree politely', 'Interrupt a speaker', 'Ask for evidence', 'Conclude discussion', 'Redirect topic'].map((scenario) => (
                            <Chip
                                key={scenario}
                                label={scenario}
                                size="small"
                                onClick={() => {
                                    setPhraseContext(scenario);
                                    setPhraseIntent('Professional');
                                }}
                                sx={{ cursor: 'pointer', bgcolor: 'primary.50', color: 'primary.main', fontWeight: 500 }}
                            />
                        ))}
                    </Box>

                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Tone / Intent</InputLabel>
                        <Select
                            value={phraseIntent}
                            label="Tone / Intent"
                            onChange={(e) => setPhraseIntent(e.target.value)}
                        >
                            <MenuItem value="Professional">Professional & Formal</MenuItem>
                            <MenuItem value="Assertive">Assertive & Firm</MenuItem>
                            <MenuItem value="Diplomatic">Diplomatic & Soft</MenuItem>
                            <MenuItem value="Casual">Casual & Friendly</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Complete the thought..."
                        placeholder="e.g., I want to say that [your point] but [constraint]..."
                        value={phraseContext}
                        onChange={(e) => setPhraseContext(e.target.value)}
                        variant="outlined"
                        sx={{ mb: 3 }}
                    />

                    {generatedPhrase && (
                        <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.100', position: 'relative' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2" color="primary.main" fontWeight="bold" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                    Generated Option
                                </Typography>
                                <Box>
                                    <IconButton
                                        size="small"
                                        onClick={handleGeneratePhrase}
                                        disabled={isPhraseGenLoading}
                                        title="Regenerate"
                                        sx={{ color: 'primary.main' }}
                                    >
                                        <RefreshCw size={16} className={isPhraseGenLoading ? 'animate-spin' : ''} />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleCopyPhrase(generatedPhrase)}
                                        title="Copy"
                                        sx={{ color: 'primary.main' }}
                                    >
                                        <Copy size={16} />
                                    </IconButton>
                                </Box>
                            </Box>
                            <Typography variant="body1" sx={{ color: 'text.primary', whiteSpace: 'pre-line', pr: 4 }}>
                                {generatedPhrase}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setShowPhraseGenDialog(false)}>Close</Button>
                    <Button
                        variant="contained"
                        onClick={handleGeneratePhrase}
                        disabled={isPhraseGenLoading || !phraseContext.trim()}
                        startIcon={isPhraseGenLoading ? <CircularProgress size={20} color="inherit" /> : <Sparkles size={20} />}
                    >
                        {isPhraseGenLoading ? 'Generating...' : 'Generate Magic Phrase'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                ContentProps={{ sx: { borderRadius: 2, bgcolor: '#1e293b' } }}
            />
        </Box >
    );
};

export default ContentHub;
