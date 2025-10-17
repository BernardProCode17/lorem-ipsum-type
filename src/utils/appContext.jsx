import { createContext, useContext, useState, useEffect } from 'react';
import { getRandomWords, getRandomSentences, getLoremSentences } from './wordlist';


const GameContext = createContext();

export function GameProvider({ children }) {
    const [selectedMode, setSelectedMode] = useState('normal');
    const [selectedWords, setSelectedWords] = useState('lorem');
    const [selectedWordList, setSelectedWordsList] = useState([]);
    const [loading, setLoading] = useState(false);



    // Update word list whenever selectedWords changes
    useEffect(() => {
        const fetchWordsList = async () => {
            setLoading(true);
            try {
                let words;
                
                if (selectedWords === 'lorem') {
                    // getLoremSentences is synchronous
                    words = getLoremSentences(50);
                } else if (selectedWords === 'random') {
                    // getRandomWords is async
                    words = await getRandomWords(50);
                } else if (selectedWords === 'sentences') {
                    // getRandomSentences is now synchronous (using txtgen)
                    words = getRandomSentences(10);
                }
                
                setSelectedWordsList(words);
                // console.log('Word list updated:', selectedWords, words);
            } catch (error) {
                console.error('Error fetching words:', error);
                // Fallback to lorem words on error
                setSelectedWordsList(getLoremSentences(5));
            } finally {
                setLoading(false);
            }
        };

        fetchWordsList();
    }, [selectedWords]); // Re-run when selectedWords changes

    // console.log(selectedWordList)

    return (
        <GameContext.Provider value={{
            selectedMode,
            setSelectedMode,
            selectedWords,
            setSelectedWords,
            selectedWordList,
            loading
        }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within GameProvider');
    }
    return context;
}