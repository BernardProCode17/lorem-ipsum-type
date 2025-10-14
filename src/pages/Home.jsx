import GameDisplay from "../components/GameDisplay";
import GameInformation from "../components/GameInformation";
import Gameoptions from "../components/GameOptions";
import GameRules from "../components/GameRules";

export default function Home() {

    return (
        <div>
            <GameRules />

            <div>
                <Gameoptions />
                <GameInformation />
                <GameDisplay />
            </div>
        </div>
    )
}