import React from 'react';
import { getScoreColor } from '../../utils/formatters';
import './ScoreBadge.css';

/**
 * Componente reutilizable para mostrar scores de sostenibilidad
 * @param {Object} props
 * @param {Object} props.score - Objeto de score con total y breakdown
 * @param {boolean} props.showBreakdown - Si muestra el desglose detallado
 * @param {string} props.size - Tamaño: 'small', 'medium', 'large'
 */
const ScoreBadge = ({ score, showBreakdown = false, size = 'medium' }) => {
    if (!score || !score.total) return null;

    const totalScore = score.total * 100;
    const backgroundColor = getScoreColor(score.total);

    return (
        <div className={`score-badge-container ${size}`}>
            <div
                className="score-badge-total"
                style={{ backgroundColor }}
            >
                Score: {totalScore.toFixed(0)}%
            </div>

            {showBreakdown && score.breakdown && (
                <div className="score-breakdown">
                    <div className="score-item">
                        <span className="score-label">Económico:</span>
                        <span className="score-value">{(score.breakdown.economic * 100).toFixed(0)}%</span>
                    </div>
                    <div className="score-item">
                        <span className="score-label">Ambiental:</span>
                        <span className="score-value">{(score.breakdown.environmental * 100).toFixed(0)}%</span>
                    </div>
                    <div className="score-item">
                        <span className="score-label">Social:</span>
                        <span className="score-value">{(score.breakdown.social * 100).toFixed(0)}%</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScoreBadge;
