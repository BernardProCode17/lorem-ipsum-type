import { useGame } from "../utils/appContext"


export default function Gameoptions() {

    const { selectedMode, setSelectedMode, selectedWords, setSelectedWords} = useGame();

    return (
        <section className="gamemain-gameoptions">
            <div className="gameoptions-title">
                <h2 className="gameoptions-title-h2">Choose Game Options</h2>
            </div>

            <div className="gameoptions-options">
                <div className="gameoptions-time">
                    <h3 className="gameoptions-time-title">Time</h3>

                    <div className="gameoptions-time-div">
                        <button 
                            className={`time-div-button ${selectedMode === 'casual' ? 'time-active' : ''}`}
                            onClick={() => setSelectedMode('casual')}
                        >
                            <span className="time-div-span">Casual</span>
                        </button>

                        <button 
                            className={`time-div-button ${selectedMode === 'normal' ? 'time-active' : ''}`}
                            onClick={() => setSelectedMode('normal')}
                        >
                            <span className="time-div-span">Normal</span>
                        </button>

                        <button 
                            className={`time-div-button ${selectedMode === 'typist' ? 'time-active' : ''}`}
                            onClick={() => setSelectedMode('typist')}
                        >
                            <span className="time-div-span">Typist</span>
                        </button>

                    </div>

                </div>

                <div className="gameoptions-words">
                    <h3 className="gameoptions-words-title">Words</h3>

                    <div className="gameoptions-words-div">

                        <button 
                            className={`words-div-button ${selectedWords === 'lorem' ? 'words-active' : ''}`}
                            onClick={() => setSelectedWords('lorem')}
                        >
                            <span className="words-div-span">Lorem</span>
                        </button>

                        <button 
                            className={`words-div-button ${selectedWords === 'random' ? 'words-active' : ''}`}
                            onClick={() => setSelectedWords('random')}
                        >
                            <span className="words-div-span">Random Words</span>
                        </button>

                        <button 
                            className={`words-div-button ${selectedWords === 'sentences' ? 'words-active' : ''}`}
                            onClick={() => setSelectedWords('sentences')}
                        >
                            <span className="words-div-span">Real Sentences</span>
                        </button>

                    </div>
                </div>
            </div>
        </section>
    )
}