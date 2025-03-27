import classes from "./select_model.module.css"

function SelectModel({model, set_model}) {
    return (
        <div className="d-flex col-2">
            <div className="input-group">
                <span className="input-group-text">Model</span>
                <select className={`form-select ${classes.SelectModel}`} value={model} onChange={(event) => set_model(_ => event.target.value)}>
                    <option value="llama3.2">LLama 3.2 (3B)</option>
                    <option value="mistral-nemo">Mistral NeMo</option>
                </select>
            </div>
        </div>
        );
}

export default SelectModel;