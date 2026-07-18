import { getDriverStandings, getConstructorStandings, getNextRace } from '@/lib/api';
import type { DriverStanding, ConstructorStanding, Race } from '@/types/f1';

export const metadata = {
    title: 'Dashboard',
};

export default async function DashboardPage() {
    const [driverStandings, constructorStandings, nextRace] = await Promise.all([
        getDriverStandings(),
        getConstructorStandings(),
        getNextRace(),
    ]);

    return (
        <div>
            <h1>F1 Dashboard</h1>

            {nextRace && (
                <section>
                    <h2>Next Race</h2>
                    <p>{nextRace.raceName}</p>
                    <p>{nextRace.Circuit.circuitName}, {nextRace.Circuit.Location.country}</p>
                    <p>{nextRace.date} {nextRace.time ?? ''}</p>
                </section>
            )}

            <section>
                <h2>Driver Standings</h2>
                <table>
                    <thead>
                    <tr>
                        <th>Pos</th>
                        <th>Driver</th>
                        <th>Team</th>
                        <th>Points</th>
                        <th>Wins</th>
                    </tr>
                    </thead>
                    <tbody>
                    {driverStandings.map((standing: DriverStanding) => (
                        <tr key={standing.Driver.driverId}>
                            <td>{standing.position}</td>
                            <td>{standing.Driver.givenName} {standing.Driver.familyName}</td>
                            <td>{standing.Constructors[0]?.name ?? '—'}</td>
                            <td>{standing.points}</td>
                            <td>{standing.wins}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </section>

            <section>
                <h2>Constructor Standings</h2>
                <table>
                    <thead>
                    <tr>
                        <th>Pos</th>
                        <th>Team</th>
                        <th>Points</th>
                        <th>Wins</th>
                    </tr>
                    </thead>
                    <tbody>
                    {constructorStandings.map((standing: ConstructorStanding) => (
                        <tr key={standing.Constructor.constructorId}>
                            <td>{standing.position}</td>
                            <td>{standing.Constructor.name}</td>
                            <td>{standing.points}</td>
                            <td>{standing.wins}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
}