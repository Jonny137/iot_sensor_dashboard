import React from 'react';
import axios from 'axios';
import {
    BrowserRouter as Router,
    Route,
    Redirect,
} from "react-router-dom";

import Alert from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';

import Dashboard from '../Dashboard/Dashboard';
import LoginForm from '../LoginForm/LoginForm';

import { URL, TOKEN } from '../../constants';

const CancelToken = axios.CancelToken;
const source = CancelToken.source();

export default class Main extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loggedIn: !!localStorage.getItem(TOKEN),
            wrongCredentials: false
        };

       
    
    }

    componentDidMount() {
        const token = localStorage.getItem(TOKEN);

        if (token) {
            axios.get(`${URL}/token?token=${token}`, {
                    cancelToken: source.token
                })
                .then(res => res.data)
                .then((isValid) => {
                    if (!isValid) {
                        localStorage.removeItem(TOKEN);
                    }
                    this.setState({loggedIn: isValid});
                })
                .catch(err => console.error(err));
        }
    }

    componentWillUnmount() {
        source.cancel();
    }

    handleCloseSuccess = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        this.setState({wrongCredentials: false});
    }

    loginSuccessful(token, value) {
        value ? localStorage.setItem(TOKEN, token) :
                this.setState({wrongCredentials: true});
        this.setState({loggedIn: value});
    }

    render() {
        return(
            <Router>
                <Route path="/">
                    {!this.state.loggedIn ? <Redirect exact to="/login" /> : <Dashboard />}
                </Route>
                <Route exact path="/login">
                    {
                    !this.state.loggedIn ? <LoginForm onLogin={(token, value) => this.loginSuccessful(token, value)} /> : 
                    <Redirect exact to="/" />
                    }
                </Route>
                <Snackbar open={this.state.wrongCredentials} autoHideDuration={3000} onClose={this.handleCloseSuccess}>
                    <Alert onClose={this.handleCloseSuccess} severity="error">
                        Invalid credentials
                    </Alert>
                </Snackbar>
            </Router>
        );
    }
}
