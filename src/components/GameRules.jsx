import { casual, normal, typist } from '../utils/gameruleslist'
export default function GameRules() {

    return (
        <section className="lt-main-left gamerules">
            <h2 className="gamerules-title">Game Rules</h2>

            <div className="gamerules-mode">
                {/* map over an array in an order list with game rules for the selected game mode */}
                <p className='gamerules-mode-title'>Casual Mode</p>

                <ol className='gamerules-mode-ol'>
                    {typist.map((rule, index) => (
                        <li key={index} className='gamerules-mode-li'>{rule}</li>
                    ))}
                </ol>
            </div>

            <div className="gamerules-options">
                <p className="gamerules-options-title">Options</p>

                <div className="options-time">
                    <p className="options-time-title">Time</p>
                    <ul className="options-time-ul">
                        <span className='options-time-li-title'>Casual</span>
                        <li className="options-time-li">2 minutes to complete the displayed words.</li>

                        <span className='options-time-li-title'>Normal</span>
                        <li className="options-time-li">1 minutes to complete the displayed words.</li>

                        <span className='options-time-li-title'>Typist</span>
                        <li className="options-time-li">1 minutes to complete the displayed words.</li>
                    </ul>
                </div>

                <div className="options-words">
                    <p className="options-words-title">Words</p>
                    <ul className="options-words-ul">

                        <span className='options-words-li-title'>Lorem Ipsum</span>
                        <li className="options-words-li">Randomly generated lorem ipsum words.</li>

                        <span className='options-words-li-title'>Random Words</span>
                        <li className="options-words-li">Randomly generated real words.</li>

                        <span className='options-words-li-title'>Real Senteneces</span>
                        <li className="options-words-li">Generate real words in real sentences.</li>
                    </ul>
                </div>
            </div>
        </section>
    )
}