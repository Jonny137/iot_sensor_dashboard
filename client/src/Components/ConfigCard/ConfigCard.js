import React from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Alert from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';
import Typography from '@material-ui/core/Typography';

import axios from 'axios';

import { URL } from '../../constants';

import './ConfigCard.css';

const CancelToken = axios.CancelToken;
const source = CancelToken.source();

export default class ConfigCard extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedConfig: '',
            submitSuccessful: false,
            submitFailed: false,
            getWake: false,
            errorMessage: '',
            init: true,
            menuItems: [
                {value: 120, label: '2 min'},
                {value: 180, label: '3 min'},
                {value: 300, label: '5 min'},
                {value: 600, label: '10 min'},
                {value: 3600, label: '1 h'},
                {value: 7200, label: '2 h'},
                {value: 10800, label: '3 h'},
                {value: 14400, label: '4 h'},
                {value: 21600, label: '6 h'},
                {value: 28800, label: '8 h'},
                {value: 43200, label: '12 h'},
                {value: 86400, label: '1 day'}
            ]
        };

        this.url = `${URL}/wake`;
    }

    // Close handler of successful wake configuration update notification
    onSubmitSuccess = (event, reason) => {
        reason !== 'clickaway' && this.setState({
            submitSuccessful: false,
            submitFailed: false,
            getWake: false
        });
    }

    // Change value of wake configuration
    handleChange = (event) => {
        const selectedConfig = event.target.value;

        this.setState({selectedConfig: selectedConfig});

        axios.patch(`${this.url}`, {
            name: this.props.name,
            wake: selectedConfig
        })
        .then(() => this.setState({
            submitSuccessful: true,
            errorMessage: 'Wake configuration successfully updated!'
        }))
        .catch(() => this.setState({
            submitFailed: true,
            errorMessage: 'Wake configuration failed to update!'
        }))
        .finally(() => this.props.onChange());
    }

    // Fetch current wake configuration from database handler
    handleFetch() {
        axios.get(`${this.url}/${this.props.name}`)
            .then(res => res.data)
            .then(res => {
                this.setState({selectedConfig: res.wake})
            })
            .catch(() => this.setState({
                getWake: true,
                errorMessage: 'Unable to retrieve wake configuration!'
            }))
            .finally(() => {
                this.setState({init: false})
            });
    }

    componentDidMount() {
        if (this.props.change) {
            this.handleFetch();
            this.props.onChange();
        }
    }

    componentWillUnmount() {
        source.cancel();
        this.setState = (state, callback) => {
            return;
        };
    }

    render() {
        (this.props.name !== '' && this.state.init) && this.handleFetch();

        const menuItems = [];

        this.state.menuItems.forEach((item, index) => {
            menuItems.push(
                <MenuItem key={index} value={item.value}>{item.label}</MenuItem>
            );
        });

        return (
            <Card className="config-card" variant="outlined">
                <CardContent>
                    <div className="config-card__content">
                        <Typography variant="h6" className="config-card__title">Wake Configuration</Typography>
                        <Select
                            className="config-card__select"
                            variant="outlined"
                            value={this.state.selectedConfig ? this.state.selectedConfig : ''}
                            onChange={this.handleChange}
                            disabled={!this.state.selectedConfig}
                            >
                            {menuItems}
                        </Select>
                    </div>
                </CardContent>
                <Snackbar
                    open={this.state.submitSuccessful || this.state.submitFailed || this.state.getWake}
                    autoHideDuration={3000}
                    onClose={this.onSubmitSuccess}
                >
                    <Alert onClose={this.onSubmitSuccess} severity={this.state.submitSuccessful ? "success" : "error"}>
                        {this.state.errorMessage}
                    </Alert>
                </Snackbar>
            </Card>
        );
    }
}
