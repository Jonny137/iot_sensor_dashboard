import React from 'react';

import { Link } from 'react-router-dom';
import Button from '@material-ui/core/Button';

import "./Page404.css";
class Page404 extends React.Component {
    
    handleSubmit(event) {
        event.preventDefault();
        this.props.errorPass();
    }

    render() {
        return( 
            <div className="page404-container">
                <div className="title-container">
                    <h1 className="page404-title-a">4</h1>
                    <h1 className="page404-title-b">&lt;/&gt;</h1>
                    <h1 className="page404-title-a">4</h1>
                </div>
                <div className="first-line-text">
                    <p className="first-line-a">Error404</p>
                    <p className="first-line-b">() &#123;</p>
                </div>
                <div className="second-line-text">
                    <p className="second-line-a">message</p>
                    <p className="second-line-b"> = </p>
                    <p className="second-line-c">'page not found'</p>
                    <p className="second-line-b">;</p>
                </div>
                <div className="third-line-text">
                    <p className="third-line">&#125;;</p>
                </div>
                <Link to="/" className="home-link">
                    <Button variant="contained" className="home-button" onClick={(e) => this.handleSubmit(e)}>
                        Go Home
                    </Button>
                </Link>
          </div>
        );
    }
}

export default Page404;