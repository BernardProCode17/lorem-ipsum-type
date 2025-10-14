export default function GameUser(){

    return(
        <div>
            <div>
                <label htmlFor="username">Username</label>
                <input type="text" />
            </div>

            <div>
                <label htmlFor="score">Score</label>
                <span>550p</span>
            </div>

            <div>
                <label htmlFor="abb">Abbrivation Code</label>
                <input type="text" name="abb" id="abbcode" />
            </div>

            <div>
                <label htmlFor="pin">Pin</label>
                <input type="number" name="pin" id="pincode" />
            </div>

            <button>Rank</button>

        </div>
    )
}