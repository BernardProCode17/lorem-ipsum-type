import { useGame } from "../utils/appContext";


export default function GameDisplay() {
    const { selectedWordList } = useGame();

    const textareaplaceholder = "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Voluptatem tempore tenetur perferendis consequatur? Laboriosam illum facere nemo, maxime fuga delectus nostrum praesentium hic cum, vero aperiam, ab ea. Illo, nisi.   Lorem ipsum dolor, sit amet consectetur adipisicing elit. Voluptatem tempore tenetur perferendis consequatur? Laboriosam illum facere nemo, maxime fuga delectus nostrum praesentium hic cum, vero aperiam, ab ea. Illo, nisi."

    console.log(selectedWordList)

    return (
        <div className="gamemain-display">
            <div className="display-main-textarea">
                <textarea className="display-textarea" readOnly placeholder={selectedWordList}></textarea>
            </div>

            <div className="display-main-inputcontrol">
                <div className="display-main-input">
                    <input type="text" className="display-input" />
                </div>

                <div className="display-controls">
                    <button className="display-control-start">Start</button>
                    <button className="display-control-reset">Reset</button>
                </div>
            </div>
        </div>
    )
}