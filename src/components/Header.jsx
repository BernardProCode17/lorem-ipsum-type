import { Link } from 'react-router-dom'

export default function Header(){

    return(
        <header>

            <div>
                <h1>Lorem Ipsum Type</h1>
            </div>

            <div>
                <nav>
                    <ul>
                        <li><Link to="/">Game</Link></li>
                        <li><Link to="/rank">Rank</Link></li>
                    </ul>
                </nav>
            </div>

        </header>
    )
}