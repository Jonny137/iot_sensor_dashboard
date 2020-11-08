import React from 'react';
import axios from 'axios';
import { 
    LineChart, 
    Line, 
    CartesianGrid, 
    XAxis, 
    YAxis, 
    Tooltip
} from 'recharts';

import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import './Chart.css';
import { URL } from '../../constants';

const CancelToken = axios.CancelToken;
const source = CancelToken.source();

export default class Chart extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            data: this.props.data,
            date: '',
            startDate: '',
            endDate: '',
            unit: ''
        };
    } 

    componentDidMount() {
        this.getBatteryExpiration();
        this.toggleChart(false);
    }

    componentDidUpdate() {
        if (this.props.data !== this.state.data) {
            this.setState({data: this.props.data});
            if (this.props.data.length === 0 || this.props.data === undefined) {
                this.toggleChart(false);
            } else {
                this.toggleChart(true);
            }
        }
        if (this.props.config) {
            this.getBatteryExpiration();
            this.props.change();
        }
    }

    componentWillUnmount() {
        source.cancel();
        this.setState = (state, callback) => {
            return;
        };
    }

    // Toggle chart visibility
    toggleChart(show) {
        const display = show ? 'flex' : 'none';
        document.getElementsByClassName("line-chart")[0].style.display = display;
    }

    // Method to receive expiration date of primary cell
    getBatteryExpiration() {
        axios.get(`${URL}/battery?name=${this.props.name}`)
        .then(date => date.data)
        .then(date => this.setState({date: date}))
        .catch(error => console.error(error));
    }

    // Filter button handler method
    getFilteredData() {
        this.props.filterData(
            this.props.param, 
            this.props.ylabel, 
            this.props.yunit, 
            this.state.startDate, 
            this.state.endDate
        );
    }

    render() {
        // Prepare wrapped unit format if existent
        const unit = this.props.yunit ? `[${this.props.yunit}]` : '';

        return (
            <div className="line-chart">
                <IconButton
                    color="primary"
                    component="span"
                    className="line-chart__close"
                    onClick={() => this.toggleChart(false)}
                >
                    <FontAwesomeIcon icon="times" />
                </IconButton>
                
                <LineChart 
                    width={1000} 
                    height={450} 
                    data={this.state.data} 
                    margin={{
                        top: 20, 
                        right: 20, 
                        bottom: 30, 
                        left: 50
                    }}
                >
                    <Line 
                        type="linear" 
                        dataKey={this.props.param} 
                        stroke="#42b883"
                        strokeWidth={3}
                        dot={false}
                    />
                    <CartesianGrid 
                        stroke="#ccc" 
                        strokeDasharray="5 5" 
                    />
                    <XAxis 
                        dataKey="Time"
                        tickCount={3}
                        label={{
                            value: "Time [UTC]", 
                            dy: 30, 
                            fontWeight: "bold",
                            fontSize: 20
                        }}
                        tickFormatter={value => value.split('.')[0]}
                        tick={{fontSize: 12}}
                        domain={["auto", "auto"]}
                    />
                    <YAxis 
                        dataKey={this.props.param}  
                        label={{
                            value: `${this.props.ylabel} ${unit}`, 
                            angle: -90, 
                            dx: -20,
                            fontSize: 20,
                            fontWeight: 'bold'
                            }}
                    />
                    <Tooltip />
                </LineChart>

                <div className="chart-actions">
                    <Card variant="outlined" className="line-chart__filter">
                        <CardContent className="line-chart__stats-content">
                            <Typography variant="h6" className="line-chart__filter-title">Date Filter</Typography>
                            <form className="date-filter-container__start" noValidate>
                                <TextField
                                    label="Start date"
                                    type="datetime-local"
                                    className="start-date-picker"
                                    onChange={(event) => this.setState({startDate: event.target.value + 'Z'})}
                                    InputLabelProps={{
                                    shrink: true,
                                    }}
                                />
                            </form>
                            <form className="date-filter-container__end" noValidate>
                                <TextField
                                    label="End date"
                                    type="datetime-local"
                                    className="end-date-picker"
                                    onChange={(event) => this.setState({endDate: event.target.value + 'Z'})}
                                    InputLabelProps={{
                                    shrink: true,
                                    }}
                                />
                            </form>
                            <Button
                                    variant="outlined"
                                    className="filter-button"
                                    onClick={() => this.getFilteredData()}
                            >
                            Filter
                            </Button>
                        </CardContent>
                    </Card>
                    
                    <Card variant="outlined" className="line-chart__stats">
                        <CardContent className="line-chart__stats-content">
                            <Typography variant="h6" className="line-chart__stats-title">{this.props.ylabel} Statistics</Typography>
                            <table>
                                <tbody>
                                    <tr>
                                        <td><Typography variant="subtitle2">Min:</Typography></td>
                                        <td>{this.props.statMin} {this.props.yunit}</td>
                                    </tr>
                                    <tr>
                                        <td><Typography variant="subtitle2">Max:</Typography></td>
                                        <td>{this.props.statMax} {this.props.yunit}</td>
                                    </tr>
                                    <tr>
                                        <td><Typography variant="subtitle2">Mean:</Typography></td>
                                        <td>{this.props.statMean} {this.props.yunit}</td>
                                    </tr>
                                    {this.props.ylabel === 'Battery' && 
                                    <tr>
                                        <td>
                                            <Typography variant="subtitle2">Replacement date:</Typography>
                                        </td>
                                        <td>{this.state.date}</td>
                                    </tr>
                                    }
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }
}
