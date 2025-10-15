export default function GameInformation() {

    return (
        <section className="gamemain-gameinformation">
            <h2 className="gameinformation-title-h2">Game Info</h2>

            <div className="gameinformation">
                <div className="gameinformation-div">
                    <p className="gameinformation-title" >Timer</p>
                    <div>
                        <span className="gameinformation-span current-word-count" id="timer-number">0:53</span>
                        <span className="gameinformation-span current-word-count" id="timer-min-sec" > Sec</span>
                    </div>
                </div>

                <div className="gameinformation-div">
                    <p className="gameinformation-title">Words</p>
                    <div>
                        <span className="gameinformation-span current-word-count" id="current-word-count" >23</span>
                        <span className="gameinformation-span" id="current-word-set">/50</span>
                    </div>
                </div>

                <div className="gameinformation-div">
                    <p className="gameinformation-title">Level:</p>
                    <span className="gameinformation-span" id="current-level">5</span>
                </div>

                <div className="gameinformation-div">
                    <p className="gameinformation-title">Points</p>
                    <span className="gameinformation-span current-word-count" id="current-points">550</span>
                </div>

                <div className="gameinformation-div">
                    <div>
                        <p className="gameinformation-title">Added Time</p>
                        <div>
                            <span className="gameinformation-span current-word-count">+</span>
                            <span className="gameinformation-span current-word-count" id="added-time">0.23</span>
                            <span className="gameinformation-span current-word-count" id="added-time"> Sec</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}