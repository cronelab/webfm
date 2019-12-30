import React from 'react'
import { Table } from '../../node_modules/react-bootstrap'

const RecordTable = () => {
	return (
		<React.Fragment>
			<Table striped bordered hover>
				<thead>
					<tr>
						<th>ID</th>
						<th>Task</th>
						<th>Blocks</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>PYXXNYYY</td>
						<td>Syllable Reading</td>
						<td>2</td>
					</tr>
					<tr>
						<td>PYXXNYYY</td>
						<td>Syllable Repetition</td>
						<td>2</td>
					</tr>
					<tr>
						<td>PYXXNYYY</td>
						<td>Word Reading</td>
						<td>2</td>

					</tr>
				</tbody>
			</Table>		</React.Fragment>
	)
}

export default RecordTable;