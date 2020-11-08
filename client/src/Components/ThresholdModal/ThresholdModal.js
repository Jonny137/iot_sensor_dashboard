import React from 'react';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import Fade from '@material-ui/core/Fade';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import InputAdornment from '@material-ui/core/InputAdornment';
import Button from '@material-ui/core/Button';
import Switch from '@material-ui/core/Switch';
import Typography from "@material-ui/core/Typography";

import axios from 'axios';

import { URL } from '../../constants';

import './ThresholdModal.css';

const CancelToken = axios.CancelToken;
const source = CancelToken.source();

export default class ThresholdModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            buttonDisabled1: false,
            buttonDisabled2: false,
            buttonDisabled3: false,
        };
    }

    handleSubmit(event) {
        event.preventDefault();
        let thresholds = {};

        this.props.data.forEach((sensor) => {
            const minValue = parseInt(event.target.elements[`${sensor.name}-min`].value);
            const maxValue = parseInt(event.target.elements[`${sensor.name}-max`].value);
            thresholds[sensor.name] = {
                min : minValue || sensor.threshold.min,
                max: maxValue || sensor.threshold.max,
                disabledMin: !event.target.elements[`${sensor.name}Min`].checked,
                disabledMax: !event.target.elements[`${sensor.name}Max`].checked
            }; 
        });
        thresholds.name = this.props.name;

        axios.patch(`${URL}/thresholds`, thresholds)
            .then(() => {
                this.props.onClose && this.props.onClose();
                this.props.onSubmit && this.props.onSubmit();
            })
            .catch(() => this.props.onError());
    }

    handleChangeMin(event, sensorName, index) {
        if (parseInt(event.target.value) > parseInt(document.getElementsByName(`${sensorName}-max`)[0].value)) {
            this.setState({[`buttonDisabled${index}`]: true});
        } else {
            this.setState({[`buttonDisabled${index}`]: false});
        }
    }

    handleChangeMax(event, sensorName, index) {
        if (parseInt(event.target.value) < parseInt(document.getElementsByName(`${sensorName}-min`)[0].value)) {
            this.setState({[`buttonDisabled${index}`]: true});
        } else {
            this.setState({[`buttonDisabled${index}`]: false});
        }
    }

    componentWillUnmount() {
        source.cancel();
        this.setState = (state, callback) => {
            return;
        };
    }

    render() {
        const formFields = [];

        if (this.props.data.length === 0) {
            formFields.push(
                <Typography key={1} variant="h5" color="textSecondary">
                    NO THRESHOLDS AVAILABLE
                </Typography>
            );
        } else {
            this.props.data.forEach((sensor, index) => {
                formFields.push(
                    <div key={`${index}`} className="threshold-edit">
                        <FormControl key={`${index}-min`} className="threshold-modal__form-control" variant="outlined">
                            <InputLabel htmlFor={`modal-input-${index}-min`}>Min {sensor.threshold.label}</InputLabel>
                            <OutlinedInput
                                id={`modal-input-${index}-min`}
                                name={`${sensor.name}-min`}
                                defaultValue={sensor.threshold.value.min}
                                type="number"
                                inputProps={{
                                    min: sensor.threshold.min,
                                    max: sensor.threshold.max,
                                }}
                                endAdornment={<InputAdornment position="end">{sensor.unit || ''}</InputAdornment>}
                                labelWidth={sensor.threshold.label.length * 12}
                                onChange={(e) => this.handleChangeMin(e, sensor.name, index + 1)}
                            />
                        </FormControl>
                        <Switch color="primary" defaultChecked={!sensor.threshold.value.disabledMin} name={`${sensor.name}Min`}/>
                        
                        <FormControl key={`${index}-max`} className="threshold-modal__form-control" variant="outlined">
                            <InputLabel className="threshold-max-label" htmlFor={`modal-input-${index}-max`}>Max {sensor.threshold.label}</InputLabel>
                            <OutlinedInput
                                id={`modal-input-${index}-max`}
                                className="threshold-max-input"
                                name={`${sensor.name}-max`}
                                defaultValue={sensor.threshold.value.max}
                                type="number"
                                inputProps={{
                                    min: sensor.threshold.min,
                                    max: sensor.threshold.max,
                                }}
                                endAdornment={<InputAdornment position="end">{sensor.unit || ''}</InputAdornment>}
                                labelWidth={sensor.threshold.label.length * 12 + 3}
                                onChange={(e) => this.handleChangeMax(e, sensor.name, index + 1)}
                            />
                        </FormControl>
                        <Switch color="primary" defaultChecked={!sensor.threshold.value.disabledMax} name={`${sensor.name}Max`}/>
                    </div>
                );
            });
        }

        return (
            <Modal
                className="threshold-modal__container"
                open={this.props.modalOpen}
                onClose={this.props.onClickAway}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{timeout: 500}}
            >
                <Fade in={this.props.modalOpen}>
                    <div className="threshold-modal__content">
                        <form className="threshold-modal__form" onSubmit={(e) => this.handleSubmit(e)}>
                            {formFields}
                            <Button
                                className="threshold-modal__submit"
                                variant="contained"
                                color="primary"
                                type="submit"
                                disabled={
                                    this.state.buttonDisabled1 || 
                                    this.state.buttonDisabled2 || 
                                    this.state.buttonDisabled3 ||
                                    this.props.data.length === 0}
                            >Set
                            </Button>
                        </form>
                    </div>
                </Fade>
            </Modal>
        );
    }
}
