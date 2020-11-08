import React from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import './CellCard.css';

export default class CellCard extends React.Component {

    render() {
        return (
            <Card className="cell-card" variant="outlined">
                <CardContent>
                    <FontAwesomeIcon className="cell-card__icon" icon={this.props.icon} />
                    <div className="cell-card__content">
                        <Typography variant="body2" className="cell-card__info">
                            Cell ID: {this.props.value.CID}
                        </Typography>
                        <Typography variant="body2" className="cell-card__info">
                            MNC: {this.props.value.MNC}
                        </Typography>
                        <Typography variant="body2" className="cell-card__info">
                            MCC: {this.props.value.MCC}
                        </Typography>
                        <Typography variant="subtitle1" className="cell-card__title">
                            {this.props.title}
                        </Typography>
                    </div>
                </CardContent>
            </Card>
        );
    }
}
