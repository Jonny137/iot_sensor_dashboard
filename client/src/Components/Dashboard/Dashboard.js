// React imports
import React from 'react';
import axios from 'axios';
import {
  BrowserRouter as Router,
  useRouteMatch,
  Route,
  Link,
} from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import ListItem from '@material-ui/core/ListItem';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Alert from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';
import CircularProgress from '@material-ui/core/CircularProgress';
import ListSubheader from '@material-ui/core/ListSubheader';
import Tooltip from '@material-ui/core/Tooltip';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';

// Component imports
import ConfigCard from '../ConfigCard/ConfigCard';
import CellCard from '../CellCard/CellCard';
import Chart from '../Chart/Chart';
import UIcard from '../UIcard/UIcard';
import Page404 from '../Page404/Page404';
import ThresholdModal from '../ThresholdModal/ThresholdModal';
import { URL, TOKEN } from '../../constants';

// Style
import './Dashboard.css';

const CancelToken = axios.CancelToken;
const source = CancelToken.source();

export default class Dashboard extends React.Component {

    constructor(props) {
        super(props);
  
        this.state = {
            data: {},
            devices: [],
            noDevices: false,
            currentName: '',
            latestTime: '',
            modalOpen: false,
            modalNameOpen: false,
            modalData: [],
            openSuccessThreshold: false,
            openFailedThreshold: false,
            openSuccessName: false,
            openFailedName: false,
            failedListClick: false,
            restartSuccesful: false,
            chartData: [],
            chartParam: '',
            chartYlabel: '',
            chartYunit: '',
            deviceChange: false,
            showLoader: true,
            loadError: false,
            minValue: '',
            maxValue: '',
            meanValue: '',
            configChange: false,
            hasToken: false,
            menuItem: null
        }
    }

    componentDidMount() {
        this.getDevices();
    }

    componentWillUnmount() {
        source.cancel();
        this.setState = (state, callback) => {
            return;
        };
    }

    // Fetch devices and their data from the database
    async getDevices() {
            this.setState({showLoader: true});
           
            axios.get(`${URL}/devices`, {cancelToken: source.token})
                .then(res => res.data)
                .then(data => {
                    if (window.location.pathname === '/') {
                        // Empty list case
                        if (data.length === 0) {
                            this.state.noDevices = true;
                            return;
                        // If device list is not empty
                        } else {
                            this.setState({
                                devices: data,
                                currentName: data[0],
                                noDevices: false,
                            });
                            this.setModalData();
                            window.location.href += data[0];
                        }
                    } 
                    else {
                        this.handleListItemClick(
                            decodeURIComponent(window.location.pathname.slice(1)), 
                            data, 
                            true);
                    }
                })
                .catch(() => this.setState({noDevices: true}))
                .finally(() => this.setState({showLoader: false}));
    }

    // Successful threshold set notification handler
    handleCloseSuccess = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        this.setState({openSuccessThreshold: false, openSuccessName: false});
    }

    // Successful restart notification handler
    handleRestartSuccess = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        this.setState({restartSuccesful: false});
    }

    // Unsuccessful threshold set notification handler
    handleCloseFailed = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        this.setState({openFailedThreshold: false, openFailedName: false});
    }

    // Failed to show data on list item click event notificaiton handler
    handleListFail = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        this.setState({failedListClick: false});
    }

    // Device in list clicked handler
    handleListItemClick(name, devices,  flag) {
        this.setState({showLoader: true});

        let deviceChange = false;
        let failedListClick = true;

        if (!flag) {
            deviceChange = true;
            failedListClick = false;
        }
 
        this.setState({currentName: name});
            axios.get(`${URL}/time?name=${name}`, {
                    cancelToken: source.token
                })
                .then(res => res.data)
                .then(res => this.setState({latestTime: res}))
                .catch(() => this.setState({failedListClick: failedListClick}))
            axios.get(`${URL}/configured/${name}`, {
                    cancelToken: source.token
                })
                .then(res => res.data)
                .then(res => {
                    this.setState({data: res});
                    // if (!Object.keys(this.state.data).includes(name)) {
                    //     this.setState({loadError: true});
                    // } else {
                        this.setState({
                            devices: devices ? devices : this.state.devices,
                            currentName: name,
                            chartData: [],
                            chartParam: "",
                            chartYlabel: "",
                            chartYunit: "",
                            deviceChange: deviceChange,
                        });
                        this.setModalData();
                    // }
                })
                .catch(() => this.setState({failedListClick: failedListClick}))
                .finally(() => this.setState({showLoader: false}))
    }

    // Set data for modal component
    setModalData() {
        const modalData = [];

        const deviceData = this.state.data[this.state.currentName];
        for (const key in deviceData) {
            const param = deviceData[key];
            if (!!param.threshold) {
                modalData.push(param);
            }
        }

        this.setState({
            modalData: modalData
        });
    }

    // Handle data fetching for chart
    handleDataCardClicked(name, title, unit, startDate, endDate) {
        let chartDataURL = `${URL}/data?name=${this.state.currentName}&label=${name}`;
        if (startDate) {
            chartDataURL = chartDataURL + `&date_min=${startDate}`;
        }
        if (endDate) {
            chartDataURL = chartDataURL + `&date_max=${endDate}`;
        }
        axios.get(chartDataURL, {
                cancelToken: source.token
            })
            .then(res => res.data)
            .then(res => this.setState({
                chartData: res.data, 
                chartParam: name, 
                chartYlabel: title, 
                chartYunit: unit,
                minValue: res.min,
                maxValue: res.max,
                meanValue: res.mean
            }))
            .catch(err => console.error(err));
    }

    // Send device restart request
    restartDevice(name) {
        axios.post(`${URL}/restart`, {name: name}, {
                cancelToken: source.token
            })
            .then(this.setState({restartSuccesful: true}))
            .catch(err => console.error(err));
    }

    logout() {
        localStorage.removeItem(TOKEN);
        window.location.reload(false);
    }

    render() {
        // Error case 404
        if (this.state.loadError) {
            return (
                <Router>
                    <Page404 errorPass={() => this.setState({loadError: false})} />
                </Router>
                );
        }
        
        // Show loader until data is received
        if (this.state.showLoader) {
            return <CircularProgress size="100px" thickness={2.4} style={{color: '#4b79b8'}}/>;
        }

        // Populate cards for parameter display
        const cardData = [];
        const cellData = [];

        if (this.state.currentName && Object.keys(this.state.data).includes(this.state.currentName)) {
            const deviceData = this.state.data[this.state.currentName];
            let index = 0;
            for (const key in deviceData) {
                const param = deviceData[key];
                if (param.title !== 'Cell') {
                    cardData.push(
                        <UIcard 
                            key={index++} 
                            title={param.title} 
                            icon={param.icon}
                            value={param.value}
                            unit={param.unit}
                            name={param.name}
                            deviceName={this.state.currentName}
                            cardClick={() => this.handleDataCardClicked(param.name, param.title, param.unit)}
                            threshold={param.threshold ? param.threshold : undefined}
                            charge = {param.charge ? param.charge : null}
                        />
                    );
                } else {
                    cellData.push(
                        <CellCard
                            key={index++}
                            title={param.title}
                            icon={param.icon}
                            value={param.value}
                        />
                    )
                }
            }
        }

        return (
            <div className="dashboard">
                <CssBaseline />
                <AppBar position="fixed" className="appBar">
                <Toolbar className="title-header">
                    <div className="info-header">
                        <div className="name-header">
                            <Typography className="header-label" variant="caption">DEVICE NAME</Typography>
                            <Typography variant="h5">
                                {this.state.currentName}
                            </Typography>
                        </div>
                        <div className="time-header">
                            <Typography className="header-label" variant="caption">TIME</Typography>
                            <Typography variant="h6">
                                {this.state.latestTime}
                            </Typography>
                        </div>
                    </div>
                    <div className="buttons">
                        <Tooltip title="Get latest data">
                            <Button
                                variant="outlined"
                                className="refresh-button"
                                onClick={() => this.getDevices()}
                                startIcon={<FontAwesomeIcon icon="redo-alt" className="refresh-icon" />}
                            >
                            Refresh
                            </Button>
                        </Tooltip>
                        <Button onClick={(event) => this.setState({menuItem: event.currentTarget})}>
                        <FontAwesomeIcon icon="ellipsis-v" />
                        </Button>
                        <Menu
                            id="simple-menu"
                            anchorEl={this.state.menuItem}
                            keepMounted
                            getContentAnchorEl={null}
                            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                            transformOrigin={{ vertical: "top", horizontal: "center" }}
                            open={!!this.state.menuItem}
                            onClose={() => this.setState({menuItem: null})}
                        >
                            <MenuItem onClick={() => this.setState({modalOpen: true, menuItem: null})}>
                                <Button
                                    className="threshold-button"
                                    startIcon={<FontAwesomeIcon icon="cog" className="threshold-icon" />}
                                >
                                Set Threshold
                                </Button>
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={() => this.restartDevice(this.state.currentName)}>
                                <Button
                                    className="threshold-button"
                                    startIcon={<FontAwesomeIcon icon="sync-alt" className="threshold-icon" />}
                                >
                                Restart Device
                                </Button>
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={() => {this.logout()}}>
                                <Button
                                    className="threshold-button"
                                    startIcon={<FontAwesomeIcon icon="sign-out-alt" className="threshold-icon" />}
                                >
                                Logout
                                </Button>
                            </MenuItem>
                        </Menu>
                    </div>
                    <ThresholdModal
                        modalOpen={this.state.modalOpen} 
                        data={this.state.modalData} 
                        name={this.state.currentName} 
                        onClose={() => this.setState({modalOpen: false, openSuccessThreshold: true})}
                        onSubmit={() => this.getDevices()}
                        onError={() => this.setState({openFailedThreshold: true})} 
                        onClickAway={() => this.setState({modalOpen: false})}
                    />
                </Toolbar>
                </AppBar>
                <Router>
                    <Drawer
                        className="drawer"
                        variant="permanent"
                        classes={{
                            paper: "drawerPaper",
                        }}
                        anchor="left"
                    >
                        <List
                            className="list-items"
                            subheader={
                                <ListSubheader component="div">
                                DEVICE LIST
                                </ListSubheader>
                            }
                        >
                        {this.state.devices.map((name, index) => (
                            <ListItem 
                                to={`${name}`} 
                                key={index} 
                                button 
                                onClick={() => this.handleListItemClick(`${name}`)}
                            >
                                <Route path="/">
                                    <Device name={`${name}`}/>
                                </Route>
                            </ListItem>
                        ))}
                        </List>
                    </Drawer>
                    <main className="content">
                        {this.state.noDevices && <h1 className="no-devices-text">NO DEVICES AVAILABLE</h1>}
                        <div className="toolbar" />
                        <div className="cards">
                            {cardData[0]}
                            {cellData}
                            {cardData.slice(1, cardData.length)}
                            {!this.state.noDevices && 
                            <ConfigCard
                                name={this.state.currentName} 
                                change={this.state.deviceChange}
                                onChange={() => this.setState({deviceChange: false, configChange: true})}
                            />}
                        </div>
                            <Chart 
                                data={this.state.chartData} 
                                param={this.state.chartParam} 
                                ylabel={this.state.chartYlabel} 
                                yunit={this.state.chartYunit}
                                statMin={this.state.minValue}
                                statMax={this.state.maxValue}
                                statMean={this.state.meanValue}
                                name={this.state.currentName}
                                config={this.state.configChange}
                                change={() => this.setState({configChange: false})}
                                filterData={(name, title, unit, startDate, endDate) => this.handleDataCardClicked(name, 
                                                                                                                  title, 
                                                                                                                  unit, 
                                                                                                                  startDate, 
                                                                                                                  endDate
                                                                                                                 )}
                            />
                    </main>
                </Router>
                <Snackbar open={this.state.openSuccessThreshold} autoHideDuration={2000} onClose={this.handleCloseSuccess}>
                    <Alert onClose={this.handleCloseSuccess} severity="success">
                        Thresholds successfully updated!
                    </Alert>
                </Snackbar>
                <Snackbar open={this.state.restartSuccesful} autoHideDuration={2000} onClose={this.handleRestartSuccess}>
                    <Alert onClose={this.handleRestartSuccess} severity="success">
                        Device successfully restarted!
                    </Alert>
                </Snackbar>
                <Snackbar open={this.state.openFailedThreshold} autoHideDuration={2000} onClose={this.handleCloseFailed}>
                    <Alert onClose={this.handleCloseFailed} severity="error">
                        Thresholds update failed!
                    </Alert>
                </Snackbar>
                <Snackbar open={this.state.failedListClick} autoHideDuration={2000} onClose={this.handleListFail}>
                    <Alert onClose={this.handleListFail} severity="error">
                        Unable to open device information!
                    </Alert>
                </Snackbar>
                <Snackbar open={this.state.openSuccessName} autoHideDuration={2000} onClose={this.handleCloseSuccess}>
                    <Alert onClose={this.handleCloseSuccess} severity="success">
                        Device name successfully updated!
                    </Alert>
                </Snackbar>
                <Snackbar open={this.state.openFailedName} autoHideDuration={2000} onClose={this.handleCloseFailed}>
                    <Alert onClose={this.handleCloseFailed} severity="error">
                        Device name update failed!
                    </Alert>
                </Snackbar>
            </div>
        );
            
            // Link generator method
            function Device(args) {
                let match = useRouteMatch();
                return (
                    <Link to={`${match.url}${args.name}`} className="link">{args.name}</Link>
                ); 
            }
    }
}
