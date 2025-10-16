export default function RankTable() {

    return (
        <section className="lt-rank-main">
            <h2 className="rank-main-title">Rankings</h2>
            <div>

                {/* table head */}
                <table className="rank-table">
                    {/* table head */}
                    <tr className="rank-table-row-head">
                        <th className="rank-table-head head-rank">Rank</th>
                        <th className="rank-table-head head-name">Name</th>
                        <th className="rank-table-head head-score">Score</th>
                    </tr>
                
                {/* table rows */}
                <tr className="rank-table-row">                 
                        <td className="rank-table-data data-rank">1</td>
                        <td className="rank-table-data data-name">Bernard Clarke</td>
                        <td className="rank-table-data data-score">550p</td>                   
                </tr>

                <tr className="rank-table-row">
                        <td className="rank-table-data data-rank">2</td>
                        <td className="rank-table-data data-name">Second Rank</td>
                        <td className="rank-table-data data-score">530p</td>
                </tr>

                <tr className="rank-table-row">
                        <td className="rank-table-data data-rank">3</td>
                        <td className="rank-table-data data-name">Third Rank</td>
                        <td className="rank-table-data data-score">500p</td>
                </tr>

                </table>

            </div>
        </section>
    )
}