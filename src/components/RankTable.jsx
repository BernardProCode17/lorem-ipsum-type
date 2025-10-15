export default function RankTable() {

    return (
        <section className="lt-rank-main">
            <h2 className="rank-main-title">Rankings</h2>
            <div>
                <table className="rank-table">
                    <tr className="rank-table-row">
                        <th className="rank-table-head">Rank</th>
                        <th className="rank-table-head">Name</th>
                        <th className="rank-table-head">Score</th>
                    </tr>

                    <tr className="rank-table-row">
                        <div>
                            <td className="rank-table-data">1</td>
                            <td className="rank-table-data">First Rank</td>
                            <td className="rank-table-data">550p</td>
                        </div>
                        <div>
                            <td className="rank-table-data">2</td>
                            <td className="rank-table-data">Second Rank</td>
                            <td className="rank-table-data">530p</td>
                        </div>
                        <div>
                            <td className="rank-table-data">3</td>
                            <td className="rank-table-data">Third Rank</td>
                            <td className="rank-table-data">500p</td>
                        </div>

                    </tr>
                </table>
            </div>
        </section>
    )
}