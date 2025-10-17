export default function GameUser() {

    return (
        <section className="lt-rank-modal">

            <h2 className="rank-modal-title">Enter Rank</h2>

            <div className="rank-modal-input modal-username">
                <label htmlFor="username" className="modal-input-label">Username</label>
                <input type="text" className="modal-input-username" placeholder="Name For Rank" />
            </div>

            <div className="rank-modal-input modal-score">
                <label htmlFor="score" className="modal-input-label">Score</label>
                <span className="modal-input-score">0</span>
            </div>

            <div className="rank-modal-input modal-abb">
                <label htmlFor="abb" className="modal-input-label">Abbrivation Code</label>
                <input type="text" name="abb" id="abbcode" className="modal-input-abb" maxLength={5} placeholder="T9e5" />
            </div>

            <div className="rank-modal-input modal-pin">
                <label htmlFor="pin" className="modal-input-label">Pin</label>
                <input type="text" name="pin" id="pincode" minLength={4} maxLength={5} className="modal-input-pin" placeholder="9733" />
            </div>

            <div className="rank-modal-input">
                <button className="modal-button">Rank</button>
            </div>

        </section>
    )
}