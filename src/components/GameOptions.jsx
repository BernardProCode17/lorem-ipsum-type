export default function Gameoptions() {

    return (
        <section className="gamemain-gameoptions">
            <div className="gameoptions-title">
                <h2 className="gameoptions-title-h2">Choose Game Options</h2>
            </div>

            <div className="gameoptions-options">
                <div className="gameoptions-time">
                    <h3 className="gameoptions-time-title">Time</h3>

                    <div className="gameoptions-time-div">
                        <button className="time-div-button">
                            <span className="time-div-span">Casual</span>
                        </button>

                        <button className="time-div-button time-active">
                            <span className="time-div-span">Normal</span>
                        </button>

                        <button className="time-div-button">
                            <span className="time-div-span">Typist</span>
                        </button>

                    </div>

                </div>

                <div className="gameoptions-words">
                    <h3 className="gameoptions-words-title">Words</h3>

                    <div className="gameoptions-words-div">
                        <button className="words-div-button words-active">
                            <span className="words-div-span">Lorem</span>
                        </button>

                        <button className="words-div-button">
                            <span className="words-div-span">Random Words</span>
                        </button>
                        
                        <button className="words-div-button">
                            <span className="words-div-span">Real Sentences</span>
                        </button>

                    </div>
                </div>
            </div>
        </section>
    )
}