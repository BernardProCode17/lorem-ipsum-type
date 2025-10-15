import GameDisplay from "../components/GameDisplay";
import GameInformation from "../components/GameInformation";
import Gameoptions from "../components/GameOptions";
import GameRules from "../components/GameRules";

export default function Home() {

    return (
        <div className="lt-main">
            <GameRules />

            <div className="lt-main-right lt-gamemain">
                <Gameoptions />
                <GameInformation />
                <GameDisplay />
            </div>
        </div>
    )
}