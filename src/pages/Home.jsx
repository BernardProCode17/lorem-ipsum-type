import GameDisplay from "../components/GameDisplay";
import GameInformation from "../components/GameInformation";
import Gameoptions from "../components/GameOptions";
import GameRules from "../components/GameRules";
import {GameProvider} from "../utils/appContext";

export default function Home() {

    return (
        <GameProvider>
            
            <div className="lt-main">
                <GameRules />

                <div className="lt-main-right lt-gamemain">
                    <Gameoptions />
                    <GameInformation />
                    <GameDisplay />
                </div>
            </div>
        </GameProvider>
    )
}