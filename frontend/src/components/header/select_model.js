import classes from "./select_model.module.css"

function SelectModel({model, set_model}) {
    return (
        <div className="d-flex col-2">
            <div className="input-group">
                <span className="input-group-text">Model</span>
                <select className={`form-select ${classes.SelectModel}`} value={model} onChange={(event) => set_model(_ => event.target.value)}>
                    <option value="open-mistral-nemo">Mistral NeMo</option>
                    <option value="mistral-small-latest">Mistral Small</option>
                    <option value="ministral-3b-latest">Ministral 3B</option>
                    <option value="ministral-8b-latest">Ministral 8B</option>
                    <option value="mistral-large-latest">Mistral Large</option>
                </select>
            </div>
        </div>
        );
}

export default SelectModel;