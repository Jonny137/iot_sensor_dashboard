import React from 'react';
import axios from 'axios';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Particles from 'react-particles-js';

import './LoginForm.css';
import { URL } from '../../constants';

export default class LoginForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = { 
            width: "0px", 
            height: "0px",
        };
    }

    componentDidMount() {
        this.updateWindowDimensions();
        window.addEventListener("resize", this.updateWindowDimensions);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.updateWindowDimensions);
    }

    updateWindowDimensions = () => {
        this.setState({
        width: `${window.innerWidth}px`,
        height: `${window.innerHeight}px`
        });
    };

    userLogin(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username && password) {
            axios.post(`${URL}/login`, {username: username, password: password})
            .then(res => res.data)
            .then((token) => this.props.onLogin(token, true))
            .catch(err => this.props.onLogin(null, false));
        }
    }

    render() {
        return (
            <div>
                <Particles
                    {...this.state}
                    className="particles"
                    params={{
                        particles: {
                        color: {
                            value: "#FFFFFF"
                        },
                        line_linked: {
                            color: {
                            value: "#FFFFFF"
                            }
                        },
                        number: {
                            value: 100
                        },
                        size: {
                            value: 3
                        }
                        }
                    }}
                />
                <form className="login-form">
                        <Typography 
                            className="login-headline" 
                            variant="h5"
                        >
                        Connected Sensor Device Login</Typography>
                        <TextField
                            required
                            autoComplete="on"
                            id="username"
                            className="username-input"
                            label="Username"
                            variant="outlined"
                        />
                        <TextField
                            required
                            id="password"
                            className="password-input"
                            label="Password"
                            type="password"
                            autoComplete="current-password"
                            variant="outlined"
                        />
                        <Button 
                            className="login-button"
                            variant="outlined"
                            size="large"
                            type="submit"
                            onClick={(event) => this.userLogin(event)}
                        >Login
                        </Button>
                </form>
            </div>
        );
    }
}