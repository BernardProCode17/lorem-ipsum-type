import { Link } from 'react-router-dom'

export default function Header(){

    return(
        <header className='lt-header'>

            <div className='lt-header-title'>
                <h1 className='header-title'>Lorem Ipsum Type</h1>
            </div>

            <div className='lt-header-nav'>
                <nav className='header-nav'>
                    <ul className='header-nav-ul'>
                        <li className='header-nav-li'><Link className='header-nav-link-active' to="/">Game</Link></li>
                        <li className='header-nav-li'><Link className='header-nav-link' to="/rank">Rank</Link></li>
                    </ul>
                </nav>
            </div>

        </header>
    )
}