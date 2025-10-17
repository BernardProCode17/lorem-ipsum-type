import { casual, normal, typist } from '../utils/gameruleslist';
import { useGame } from '../utils/appContext'
export default function GameRules() {
    const { selectedMode } = useGame();

    const rulesMap = {
        casual: casual,
        normal: normal,
        typist: typist
    };

    const currentRules = rulesMap[selectedMode];
    const modeTitle = selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1);

    return (
        <section className="lt-main-left gamerules">
            <h2 className="gamerules-title">Game Rules</h2>

            <div className="gamerules-mode">
                <p className='gamerules-mode-title'>{modeTitle}</p>

                <ol className='gamerules-mode-ol'>
                    {currentRules.map((rule, index) => (
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