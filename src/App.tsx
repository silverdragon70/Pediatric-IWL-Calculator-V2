import React, { useState } from "react";
import {
  Baby,
  ChevronDown,
  ChevronUp,
  Sun,
  Thermometer,
  Droplets,
  Flame,
  AlertTriangle,
  Calculator,
  Info,
  Calendar
} from "lucide-react";

const getNormalRRByAge = (months: number) => {
  if (months < 1) return { min: 30, max: 60, label: "Newborn (<1 month)" };
  if (months < 3) return { min: 30, max: 50, label: "1–3 months" };
  if (months < 6) return { min: 25, max: 40, label: "3–6 months" };
  if (months < 12) return { min: 20, max: 35, label: "6–12 months" };
  if (months < 36) return { min: 20, max: 30, label: "1–3 years" };
  return { min: 15, max: 25, label: "3+ years" };
};

interface CalculationResult {
  totalIWL_low: string;
  totalIWL_high: string;
  hourly_low: string;
  hourly_high: string;
  rrAdjustment: number;
  feverAdjustment: number;
  temperature: string;
  factors: {
    phototherapy: boolean;
    radiantWarmer: boolean;
    lowHumidity: boolean;
    burns: boolean;
  };
  baseIWL_low: number;
  baseIWL_high: number;
  factorPercentages: {
    phototherapy: number;
    radiantWarmer: number;
    lowHumidity: number;
    burns: number;
  };
  bsa: number;
  additionalAdjustment_low: number;
  additionalAdjustment_high: number;
  feverMultiplier: number;
  rrRange: {
    min: number;
    max: number;
    label: string;
  };
}

const PediatricIWLCalculator = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [showReferences, setShowReferences] = useState(false);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [temperature, setTemperature] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [ageMonthsOnly, setAgeMonthsOnly] = useState("");
  const [factors, setFactors] = useState({
    phototherapy: false,
    radiantWarmer: false,
    lowHumidity: false,
    burns: false
  });
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState("");
  const [hoveredFactor, setHoveredFactor] = useState<string | null>(null);

  const factorExplanations = {
    phototherapy: "Phototherapy using blue light to treat jaundice increases IWL by 20% due to increased skin blood flow and heat production.",
    radiantWarmer: "Radiant warmers increase IWL by 30% due to increased ambient temperature and direct radiant heat affecting skin temperature.",
    lowHumidity: "Low humidity environments (<50%) increase IWL by 25% as the gradient for water evaporation from skin increases.",
    burns: "Burns significantly increase IWL by 50% due to loss of skin barrier function and increased metabolic rate."
  };

  const references = [
    "Fanaroff, A. A., & Stoll, B. J. (2019). Fanaroff and Martin's Neonatal-Perinatal Medicine: Diseases of the Fetus and Infant (11th ed.). Elsevier.",
    "Kliegman, R. M., St. Geme, J. W., Blum, N. J., Shah, S. S., Tasker, R. C., & Wilson, K. M. (2020). Nelson Textbook of Pediatrics (21st ed.). Elsevier.",
    "Oh, W. (1978). Fluid and electrolyte management in low-birth-weight infants. Clinics in Perinatology, 5(1), 173-182.",
    "Bell, E. F., & Oh, W. (1980). Fluid and electrolyte management. In G. B. Avery (Ed.), Neonatology: Pathophysiology and Management of the Newborn (2nd ed., pp. 697-710). Lippincott.",
    "Baumgart, S. (1982). Radiant energy and insensible water loss in the premature newborn. Clinical Pediatrics, 21(3), 136-139.",
    "Hammarlund, K., & Sedin, G. (1979). Transepidermal water loss in newborn infants. VII. Relation to gestational age. Acta Paediatrica Scandinavica, 68(6), 795-801."
  ];

  // Prevent wheel scrolling on number inputs
  const handleWheel = (e: React.WheelEvent) => {
    e.currentTarget.blur();
  };

  const validateInputs = () => {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    if (isNaN(weightNum) || weightNum <= 0) {
      setError("Please enter a valid weight (kg)");
      return false;
    }
    if (isNaN(heightNum) || heightNum <= 0) {
      setError("Please enter a valid height (cm)");
      return false;
    }
    setError("");
    return true;
  };

  const calculateIWL = () => {
    if (!validateInputs()) return;
    
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    const tempNum = parseFloat(temperature);
    const rrNum = parseFloat(respiratoryRate);
    const feverAdjustment = !isNaN(tempNum) && tempNum > 37 ? (tempNum - 37) * 0.13 : 0;
    const ageInMonths = (parseInt(ageYears || "0") * 12) + parseInt(ageMonthsOnly || "0");
    
    const bsa = Math.sqrt((heightNum * weightNum) / 3600);
    const baseIWL_low = bsa * 400;
    const baseIWL_high = bsa * 500;
    const feverMultiplier = 1 + feverAdjustment;
    
    let rrAdjustment = 0;
    const rrRange = getNormalRRByAge(ageInMonths);
    if (!isNaN(rrNum) && rrNum > rrRange.max) {
      rrAdjustment = (rrNum - rrRange.max) * 2 * weightNum;
    }
    
    const factorPercentages = {
      phototherapy: 0.2,
      radiantWarmer: 0.3,
      lowHumidity: 0.25,
      burns: 0.5
    };
    
    const additionalAdjustment_low = Object.entries(factors).reduce(
      (sum, [key, enabled]) => enabled ? sum + baseIWL_low * factorPercentages[key as keyof typeof factorPercentages] : sum,
      0
    );
    const additionalAdjustment_high = Object.entries(factors).reduce(
      (sum, [key, enabled]) => enabled ? sum + baseIWL_high * factorPercentages[key as keyof typeof factorPercentages] : sum,
      0
    );
    
    const totalIWL_low = (baseIWL_low * feverMultiplier) + rrAdjustment + additionalAdjustment_low;
    const totalIWL_high = (baseIWL_high * feverMultiplier) + rrAdjustment + additionalAdjustment_high;
    
    setResult({
      totalIWL_low: totalIWL_low.toFixed(1),
      totalIWL_high: totalIWL_high.toFixed(1),
      hourly_low: (totalIWL_low / 24).toFixed(1),
      hourly_high: (totalIWL_high / 24).toFixed(1),
      rrAdjustment,
      feverAdjustment,
      temperature,
      factors,
      baseIWL_low,
      baseIWL_high,
      factorPercentages,
      bsa,
      additionalAdjustment_low,
      additionalAdjustment_high,
      feverMultiplier,
      rrRange
    });
  };

  const handleFactorChange = (factor: keyof typeof factors) => {
    setFactors(prev => ({
      ...prev,
      [factor]: !prev[factor]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl shadow-xl">
              <Baby className="text-white" size={48} />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Pediatric IWL Calculator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Evidence-based Insensible Water Loss Calculator for Pediatric Patients
          </p>
        </div>

        {/* Main Content - Changed to single column layout */}
        <div className="space-y-8">
          {/* Input Section - Now full width */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center mb-6">
              <Calculator className="text-blue-600 mr-3" size={24} />
              <h2 className="text-2xl font-semibold text-gray-800">Patient Information</h2>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6 flex items-center">
                <AlertTriangle className="mr-3 flex-shrink-0" size={20} />
                <span className="text-lg">{error}</span>
              </div>
            )}

            {/* Required Fields */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter weight"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  onWheel={handleWheel}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter height"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  onWheel={handleWheel}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Optional Fields */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
                <Info className="mr-2" size={20} />
                Optional Parameters
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature (°C)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="37.0"
                    value={temperature}
                    onChange={e => setTemperature(e.target.value)}
                    onWheel={handleWheel}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Respiratory Rate
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter RR"
                    value={respiratoryRate}
                    onChange={e => setRespiratoryRate(e.target.value)}
                    onWheel={handleWheel}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Age Section - Improved */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Calendar className="mr-2" size={18} />
                  Patient Age
                </label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                        Years
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={ageYears}
                        onChange={e => setAgeYears(e.target.value)}
                        onWheel={handleWheel}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                        Months
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={ageMonthsOnly}
                        onChange={e => setAgeMonthsOnly(e.target.value)}
                        onWheel={handleWheel}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 flex items-center">
                    <Info className="mr-1" size={12} />
                    Example: For a 2 years 8 months old patient, enter "2" years and "8" months
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Adjustments */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Additional Adjustments</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { key: 'phototherapy', icon: Sun, color: 'text-yellow-500', label: 'Phototherapy' },
                  { key: 'radiantWarmer', icon: Thermometer, color: 'text-red-500', label: 'Radiant Warmer' },
                  { key: 'lowHumidity', icon: Droplets, color: 'text-blue-500', label: 'Low Humidity' },
                  { key: 'burns', icon: Flame, color: 'text-orange-500', label: 'Burns' }
                ].map(({ key, icon: Icon, color, label }) => (
                  <div key={key} className="relative">
                    <label 
                      className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-all border border-gray-200 hover:border-gray-300"
                      onMouseEnter={() => setHoveredFactor(key)}
                      onMouseLeave={() => setHoveredFactor(null)}
                    >
                      <input
                        type="checkbox"
                        checked={factors[key as keyof typeof factors]}
                        onChange={() => handleFactorChange(key as keyof typeof factors)}
                        className="rounded w-5 h-5 text-blue-600 focus:ring-blue-500"
                      />
                      <Icon className={color} size={24} />
                      <span className="text-lg font-medium">{label}</span>
                    </label>
                    {hoveredFactor === key && (
                      <div className="absolute top-full mt-2 left-0 z-20 w-full bg-white border border-gray-200 rounded-lg shadow-xl p-4">
                        <div className="flex items-center mb-2">
                          <Icon className={`${color} mr-2`} size={20} />
                          <span className="font-semibold text-lg">{label}</span>
                        </div>
                        <p className="text-base text-gray-600">{factorExplanations[key as keyof typeof factorExplanations]}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={calculateIWL} 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all text-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Calculate IWL
            </button>
          </div>

          {/* Results Section - Now full width */}
          {result && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">Results</h3>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200 mb-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Daily IWL</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {result.totalIWL_low} – {result.totalIWL_high} <span className="text-lg">mL/day</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hourly IWL</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {result.hourly_low} – {result.hourly_high} <span className="text-lg">mL/hour</span>
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full text-blue-700 hover:text-blue-900 font-medium flex items-center justify-center py-3 px-4 rounded-lg hover:bg-blue-50 transition-all"
              >
                {showDetails ? <ChevronUp className="mr-2" size={20} /> : <ChevronDown className="mr-2" size={20} />}
                How it's calculated
              </button>
            </div>
          )}

          {/* Detailed Calculation */}
          {result && showDetails && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-2xl font-semibold text-blue-700 mb-6">Step-by-Step Calculation</h3>
              
              <div className="space-y-6">
                {/* Step 1: BSA */}
                <div className="bg-blue-50 p-6 rounded-xl">
                  <h4 className="font-semibold mb-3 text-blue-700 text-lg">Step 1: Calculate Body Surface Area (BSA)</h4>
                  <div className="space-y-2 text-gray-700">
                    <div><strong>Formula:</strong> BSA = √((height × weight) / 3600)</div>
                    <div><strong>Calculation:</strong> BSA = √(({height} × {weight}) / 3600)</div>
                    <div><strong>Result:</strong> BSA = {result.bsa.toFixed(3)} m²</div>
                  </div>
                </div>

                {/* Step 2: Base IWL */}
                <div className="bg-blue-50 p-6 rounded-xl">
                  <h4 className="font-semibold mb-3 text-blue-700 text-lg">Step 2: Calculate Base IWL</h4>
                  <div className="space-y-2 text-gray-700">
                    <div><strong>Formula:</strong> Base IWL = 400–500 mL/m²/day × BSA</div>
                    <div><strong>Calculation:</strong> Base IWL = 400–500 × {result.bsa.toFixed(3)}</div>
                    <div><strong>Result:</strong> Base IWL = {result.baseIWL_low.toFixed(1)} – {result.baseIWL_high.toFixed(1)} mL/day</div>
                  </div>
                </div>

                {/* Fever Adjustment */}
                {result.feverAdjustment > 0 && (
                  <div className="bg-red-50 p-6 rounded-xl">
                    <h4 className="font-semibold mb-3 text-red-700 text-lg">Step 3: Apply Fever Adjustment</h4>
                    <div className="space-y-2 text-gray-700">
                      <div><strong>Formula:</strong> Fever Multiplier = 1 + (Temperature - 37) × 0.13</div>
                      <div><strong>Calculation:</strong> Fever Multiplier = 1 + ({result.temperature} - 37) × 0.13</div>
                      <div><strong>Result:</strong> Fever Multiplier = {result.feverMultiplier.toFixed(3)} (+{(result.feverAdjustment * 100).toFixed(1)}%)</div>
                    </div>
                  </div>
                )}

                {/* RR Adjustment */}
                {result.rrAdjustment > 0 && (
                  <div className="bg-green-50 p-6 rounded-xl">
                    <h4 className="font-semibold mb-3 text-green-700 text-lg">
                      Step {result.feverAdjustment > 0 ? '4' : '3'}: Apply Respiratory Rate Adjustment
                    </h4>
                    <div className="space-y-2 text-gray-700">
                      <div><strong>Formula:</strong> RR Adjustment = (RR - Normal Max RR) × 2 × Weight</div>
                      <div><strong>Calculation:</strong> RR Adjustment = ({respiratoryRate} - {result.rrRange.max}) × 2 × {weight}</div>
                      <div><strong>Result:</strong> RR Adjustment = +{result.rrAdjustment.toFixed(1)} mL/day</div>
                    </div>
                  </div>
                )}

                {/* Additional Adjustments */}
                {Object.values(result.factors).some(Boolean) && (
                  <div className="bg-purple-50 p-6 rounded-xl">
                    <h4 className="font-semibold mb-3 text-purple-700 text-lg">
                      Additional Factor Adjustments
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(result.factors).map(([key, val]) => {
                        if (!val) return null;
                        const factorName = key === 'lowHumidity' ? 'Low Humidity' : key.charAt(0).toUpperCase() + key.slice(1);
                        const percentage = (result.factorPercentages[key as keyof typeof result.factorPercentages] * 100);
                        const lowAdjustment = (result.baseIWL_low * result.factorPercentages[key as keyof typeof result.factorPercentages]).toFixed(1);
                        const highAdjustment = (result.baseIWL_high * result.factorPercentages[key as keyof typeof result.factorPercentages]).toFixed(1);
                        return (
                          <div key={key} className="bg-white p-4 rounded-lg">
                            <div><strong>{factorName}:</strong> +{percentage}% of Base IWL</div>
                            <div className="text-gray-600">= +{lowAdjustment} – {highAdjustment} mL/day</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Final Calculation */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-l-4 border-blue-500">
                  <h4 className="font-semibold mb-3 text-blue-700 text-xl">Final Calculation</h4>
                  <div className="space-y-3 text-gray-700">
                    <div><strong>Formula:</strong> Total IWL = (Base IWL × Fever Multiplier) + RR Adjustment + Additional Adjustments</div>
                    <div>
                      <strong>Low Range:</strong> ({result.baseIWL_low.toFixed(1)} × {result.feverMultiplier.toFixed(3)}) + {result.rrAdjustment.toFixed(1)} + {result.additionalAdjustment_low.toFixed(1)} = {result.totalIWL_low} mL/day
                    </div>
                    <div>
                      <strong>High Range:</strong> ({result.baseIWL_high.toFixed(1)} × {result.feverMultiplier.toFixed(3)}) + {result.rrAdjustment.toFixed(1)} + {result.additionalAdjustment_high.toFixed(1)} = {result.totalIWL_high} mL/day
                    </div>
                    <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                      <div className="font-semibold text-lg">Hourly IWL: {result.hourly_low} – {result.hourly_high} mL/hour</div>
                      <div className="text-base text-gray-600">(Total Daily IWL ÷ 24 hours)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* References Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <button
              onClick={() => setShowReferences(!showReferences)}
              className="w-full text-left font-semibold text-gray-700 flex justify-between items-center hover:text-blue-700 text-lg py-2"
            >
              <span>Scientific References</span>
              {showReferences ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {showReferences && (
              <div className="mt-6 text-base text-gray-800">
                <ol className="list-decimal pl-6 space-y-3">
                  {references.map((ref, index) => (
                    <li key={index} className="leading-relaxed">{ref}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Medical Disclaimer */}
          <div className="bg-red-50 rounded-2xl shadow-xl p-8 border border-red-200">
            <div className="font-semibold text-red-700 flex items-center mb-4 text-lg">
              <AlertTriangle className="mr-3" size={24} />
              <span>Medical Disclaimer</span>
            </div>
            <div className="text-base text-red-800 space-y-3 leading-relaxed">
              <p>
                <strong>Important:</strong> This calculator is for educational and informational purposes only. 
                The information provided may not be accurate and should not be considered as medical advice. 
                Always consult with a qualified healthcare professional or neonatologist before making any clinical decisions.
              </p>
              <p>
                This tool does not replace professional medical judgment, clinical assessment, or established protocols. 
                Healthcare providers must verify all calculations and consider individual patient factors, institutional guidelines, 
                and current evidence-based practices.
              </p>
              <p>
                Use of this calculator is at your own risk. The developers assume no responsibility for any clinical decisions made based on this tool.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PediatricIWLCalculator;