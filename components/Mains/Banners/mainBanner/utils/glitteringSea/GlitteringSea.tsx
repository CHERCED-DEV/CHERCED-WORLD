import { useEffect } from 'react'
import { backGround } from './background';

const GlitteringSea = () => {
    useEffect(() => {
        backGround();
    }, []);

    return (
        <div className="glitteringSea"><canvas id="canvas"></canvas></div>
    )
}

export default GlitteringSea