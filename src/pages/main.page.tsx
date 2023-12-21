import React, { useState } from "react";
import InputText from "../components/input";
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";

type MatrixType = number[][];

type MaximaxResult = {
  maxValuesPerRow: number[];
  overallMax: number;
};

type MinimaxResult = {
  minValuesPerRow: number[];
  overallMax: number;
}

type MaximinResult = {
  maxValuesPerRow: number[];
  overallMin: number;
}

type HurwiczResult = {
  alpha: number;
  hurwiczValuesPerRow: HurwiczValueRowResult[];
  overallValue: number;
};

type HurwiczValueRowResult = {
  maxVal: number;
  minVal: number;
  hurwiczValue: number;
}

type SavageResult = {
  regretMatrix: MatrixType;
  minMaxRegrets: number[];
  decision: number;
};

interface MinVarianceResult {
  variances: number[];
  minVariance: number;
  decisionIndex: number;
}

interface MaxProbabilityDistributionResult {
  probabilitiesAboveThreshold: number[];
  maxProbability: number;
  decisionIndex: number;
}

interface ModalCriterionResult {
  modalValues: number[];
  maxModalValue: number;
  decisionIndex: number;
}

const MainPage = () => {
  const [buttonEnabled1, setButtonEnabled1] = useState<Boolean>(false);
  const [buttonEnabled2, setButtonEnabled2] = useState<Boolean>(false);
  const [rows, setRows] = useState<number>(0);
  const [columns, setColumns] = useState<number>(0);
  const [matrix, setMatrix] = useState<MatrixType>([]);
  const [maximaxResult, setMaximaxResult] = useState<MaximaxResult | null>(null);
  const [minimaxResult, setMinimaxResult] = useState<MinimaxResult | null>(null);
  const [maximinResult, setMaximinResult] = useState<MaximinResult | null>(null);
  const [selectedCriterion, setSelectedCriterion] = useState<"minimax" | "maximin">("minimax");
  const [alphaOptimistic, setAlphaOptimistic] = useState<number>(0.8);
  const [alphaPessimistic, setAlphaPessimistic] = useState<number>(0.3);
  const [hurwiczOptimisticResult, setHurwiczOptimisticResult] = useState<HurwiczResult | null>(null);
  const [hurwiczPessimisticResult, setHurwiczPessimisticResult] = useState<HurwiczResult | null>(null);
  const [savageResult, setSavageResult] = useState<SavageResult | null>(null);

  const handleOptimisticAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAlphaOptimistic(parseFloat(e.target.value));
  };

  const handlePessimisticAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAlphaPessimistic(parseFloat(e.target.value));
  };

  const updateMatrix = (rowCount: number, columnCount: number) => {
    setMatrix(Array.from({ length: rowCount }, () => Array(columnCount).fill(0)));
  };

  const handleRowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rowCount = parseInt(e.target.value, 10) || 0;
    setRows(rowCount);
    updateMatrix(rowCount, columns);
  }

  const handleColumnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const columnCount = parseInt(e.target.value, 10) || 0;
    setColumns(columnCount);
    updateMatrix(rows, columnCount);
  }

  const handleMatrixValueChange = (rowIndex: number, cellIndex: number) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value ? parseInt(e.target.value, 10) : 0;
      const newMatrix = matrix.map((row, rIdx) => (
        rIdx === rowIndex ? row.map((cell, cIdx) => (
          cIdx === cellIndex ? value : cell
        )) : row
      ));
      setMatrix(newMatrix);
  };


  const maximaxCriterion = (matrix: MatrixType) => {
    const maxValuesPerRow = matrix.map(row => Math.max(...row));
    const overallMax = Math.max(...maxValuesPerRow);

    setMaximaxResult({ maxValuesPerRow, overallMax });
  };

  const minimaxCriterion = (matrix: MatrixType) => {
    const minValuesPerRow = matrix.map(row => Math.min(...row));
    const overallMax = Math.max(...minValuesPerRow);

    setMinimaxResult({ minValuesPerRow, overallMax });
  }

  const maximinCriterion = (matrix: MatrixType) => {
    const maxValuesPerRow = matrix.map(row => Math.max(...row));
    const overallMin = Math.min(...maxValuesPerRow);

    setMaximinResult({ maxValuesPerRow, overallMin });
  }

  const hurwiczCriterion = (matrix: MatrixType, alpha: number): HurwiczResult => {
    const hurwiczValuesPerRow = matrix.map(row => {
      const maxVal = Math.max(...row);
      const minVal = Math.min(...row);
      return {
        maxVal,
        minVal,
        hurwiczValue: alpha * maxVal + (1 - alpha) * minVal
      };
    });
    const overallValue = Math.max(...hurwiczValuesPerRow.map(item => item.hurwiczValue));
  
    return { alpha, hurwiczValuesPerRow, overallValue };
  };

  const savageCriterion = (matrix: MatrixType): SavageResult => {
    const columnMaxes = matrix[0].map((_, columnIndex) => 
      Math.max(...matrix.map(row => row[columnIndex]))
    );
  
    const regretMatrix = matrix.map(row => 
      row.map((value, index) => columnMaxes[index] - value)
    );
  
    const minMaxRegrets = regretMatrix.map(row => Math.max(...row));
    const decision = minMaxRegrets.indexOf(Math.min(...minMaxRegrets)) + 1;
  
    return { regretMatrix, minMaxRegrets, decision };
  };

  const bayesianCriterion = (matrix: MatrixType, probabilities: number[]) => {
    const expectedValues = matrix.map(row =>
      row.reduce((acc, value, idx) => acc + value * probabilities[idx], 0)
    );
  
    const bestDecision = Math.max(...expectedValues);
    const decisionIndex = expectedValues.indexOf(bestDecision);
  
    return { expectedValues, bestDecision, decisionIndex };
  };

  const calculateVariance = (outcomes: number[], probabilities: number[], mean: number): number => {
    return outcomes.reduce((variance, outcome, idx) => {
      return variance + probabilities[idx] * (outcome - mean) ** 2;
    }, 0);
  };
  
  const minimizeVarianceCriterion = (matrix: MatrixType, probabilities: number[]): MinVarianceResult => {
    const means = matrix.map(row => 
      row.reduce((acc, outcome, idx) => acc + outcome * probabilities[idx], 0)
    );
  
    const variances = matrix.map((row, idx) => 
      calculateVariance(row, probabilities, means[idx])
    );
  
    const minVariance = Math.min(...variances);
    const decisionIndex = variances.indexOf(minVariance);
  
    return { variances, minVariance, decisionIndex };
  };

  const maximizeProbabilityDistributionCriterion = (
    matrix: MatrixType,
    probabilities: number[],
    threshold: number
  ): MaxProbabilityDistributionResult => {
    const probabilitiesAboveThreshold = matrix.map(row =>
      row.reduce((acc, outcome, idx) => acc + (outcome > threshold ? probabilities[idx] : 0), 0)
    );
  
    const maxProbability = Math.max(...probabilitiesAboveThreshold);
    const decisionIndex = probabilitiesAboveThreshold.indexOf(maxProbability);
  
    return { probabilitiesAboveThreshold, maxProbability, decisionIndex };
  };

  const modalCriterion = (matrix: MatrixType, probabilities: number[]): ModalCriterionResult => {
    const modalValues = matrix.map(row =>
      row.reduce((max, outcome, idx) => (probabilities[idx] * outcome > max ? probabilities[idx] * outcome : max), 0)
    );
  
    const maxModalValue = Math.max(...modalValues);
    const decisionIndex = modalValues.indexOf(maxModalValue);
  
    return { modalValues, maxModalValue, decisionIndex };
  };

  const calculate1 = () => {
    setButtonEnabled1(true);
    setButtonEnabled2(false);
    maximaxCriterion(matrix);
    minimaxCriterion(matrix);
    maximinCriterion(matrix);
    setHurwiczOptimisticResult(hurwiczCriterion(matrix, alphaOptimistic));
    setHurwiczPessimisticResult(hurwiczCriterion(matrix, alphaPessimistic));
    setSavageResult(savageCriterion(matrix));
  }

  const calculate2 = () => {
    setButtonEnabled2(true);
    setButtonEnabled1(false);
  }

  const clear = () => {
    setButtonEnabled1(false);
    setButtonEnabled2(false);
  }

  return (
    <>
        <div className="App">
          <InputText id="x" label="number of rows" value={rows} onChange={handleRowChange} />
          <InputText id="y" label="number of columns" value={columns} onChange={handleColumnChange} />
        </div>
        <div className="App">
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <TableContainer component={Paper} sx={{ maxWidth: '80%' }}>
            <Table aria-label="simple table">
              <TableBody>
                {matrix.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <input
                          type="number"
                          value={cell}
                          onChange={handleMatrixValueChange(rowIndex, cellIndex)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          </Box>
        </div>
        <div className="App">
          <br />
          <Button variant="contained" onClick={calculate1}>В умовах невизначеності</Button>
          {/* <Button variant="contained" onClick={calculate2}>В умовах ризику</Button> */}
          <Button variant="outlined" onClick={clear}>Стерти</Button>
        </div>
        {buttonEnabled1 && (
          <>
            <div className="App">
              <h3>Maximax Criterion</h3>
              {maximaxResult && (
                <div>
                  {maximaxResult.maxValuesPerRow.map((maxValue, index) => (
                    <p key={index}>
                      z<sub>{index + 1}</sub> = max z = max({matrix[index].join('; ')}) = {maxValue}
                    </p>
                  ))}
                  <p>z = max z<sub>i</sub> = {maximaxResult.overallMax} (z<sub>{maximaxResult.maxValuesPerRow.indexOf(maximaxResult.overallMax) + 1}</sub>)</p>
                </div>
              )}
            </div>
            <div className="App">
              <input type="radio" id="minimax" name="criterion" value="minimax"
                checked={selectedCriterion === "minimax"} 
                onChange={() => setSelectedCriterion("minimax")} />
              <label htmlFor="minimax">Minimax</label>

              <input type="radio" id="maximin" name="criterion" value="maximin"
                checked={selectedCriterion === "maximin"} 
                onChange={() => setSelectedCriterion("maximin")} />
              <label htmlFor="maximin">Maximin</label>
            </div>
            <div className="App">
              <h3>Minimax or Maximin Criterion</h3>
              {selectedCriterion === "minimax" && minimaxResult && (
                <div>
                  {minimaxResult.minValuesPerRow.map((minValue, index) => (
                    <p key={index}>
                      z<sub>{index + 1}</sub> = min a<sub>{index + 1}j</sub> = min({matrix[index].join('; ')}) = {minValue}
                    </p>
                  ))}
                  <p>z = max z<sub>i</sub> = {minimaxResult.overallMax} (z<sub>{minimaxResult.minValuesPerRow.indexOf(minimaxResult.overallMax) + 1}</sub>)</p>
                </div>
              )}
              {selectedCriterion === "maximin" && maximinResult && (
                <div>
                  {maximinResult.maxValuesPerRow.map((maxValue, index) => (
                    <p key={index}>
                      z<sub>{index + 1}</sub> = max a<sub>{index + 1}j</sub> = max({matrix[index].join('; ')}) = {maxValue}
                    </p>
                  ))}
                  <p>z = min z<sub>i</sub> = {maximinResult.overallMin} (z<sub>{maximinResult.maxValuesPerRow.indexOf(maximinResult.overallMin) + 1}</sub>)</p>
                </div>
              )}
            </div>
            <div className="App">
              <h3>Hurwicz Criterion</h3>
              <label>
                Optimistic Alpha: {alphaOptimistic.toFixed(2)}
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={alphaOptimistic} 
                  onChange={handleOptimisticAlphaChange} 
                />
              </label>
              {hurwiczOptimisticResult && (
                <div>
                  {hurwiczOptimisticResult.hurwiczValuesPerRow.map((item, index) => (
                    <div key={index}>
                      <p>{index + 1}: max a<sub>{index + 1}j</sub>= max({matrix[index].join('; ')}) = {item.maxVal}; min a<sub>{index + 1}j</sub> = min({matrix[index].join('; ')}) = {item.minVal};</p>
                      <p>z<sub>{index + 1}</sub> = {hurwiczOptimisticResult.alpha} * {item.maxVal} + (1 - {hurwiczOptimisticResult.alpha}) * {item.minVal} = {item.hurwiczValue}</p>
                    </div>
                  ))}
                  <p>Z = max z<sub>i</sub> = max({ hurwiczOptimisticResult.hurwiczValuesPerRow.map(item => item.hurwiczValue).join('; ')}) = {hurwiczOptimisticResult.overallValue}</p>
                </div>
              )}
              <label>
                Pessimistic Alpha: {alphaPessimistic.toFixed(2)}
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={alphaPessimistic} 
                  onChange={handlePessimisticAlphaChange} 
                />
                {hurwiczPessimisticResult && (
                <div>
                  {hurwiczPessimisticResult.hurwiczValuesPerRow.map((item, index) => (
                    <div key={index}>
                      <p>{index + 1}: max a<sub>{index + 1}j</sub>= max({matrix[index].join('; ')}) = {item.maxVal}; min a<sub>{index + 1}j</sub> = min({matrix[index].join('; ')}) = {item.minVal};</p>
                      <p>z<sub>{index + 1}</sub> = {hurwiczPessimisticResult.alpha} * {item.maxVal} + (1 - {hurwiczPessimisticResult.alpha}) * {item.minVal} = {item.hurwiczValue}</p>
                    </div>
                  ))}
                  <p>Z = max z<sub>i</sub> = max({ hurwiczPessimisticResult.hurwiczValuesPerRow.map(item => item.hurwiczValue).join('; ')}) = {hurwiczPessimisticResult.overallValue}</p>
                </div>
              )}
              </label>
            </div>
            <div className="App">
            <h3>Savage Criterion</h3>
            {savageResult && (
                <div className="App">
                  <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <TableContainer component={Paper} sx={{ maxWidth: '80%' }}>
                    <Table>
                      <TableBody>
                        {savageResult.regretMatrix.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <TableCell key={cellIndex}>{cell}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  </Box>
                  <p>Z = min z = min({savageResult.minMaxRegrets.join(', ')}) = {Math.min(...savageResult.minMaxRegrets)} = z<sub>{savageResult.decision}</sub></p>
                </div>
              )}
            </div>
          </>
        )}
    </>
  );
}

export default MainPage;
