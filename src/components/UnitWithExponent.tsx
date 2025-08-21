import React from 'react';

interface Props {
  unit: string;
}

const UnitWithExponent: React.FC<Props> = ({ unit }) => {
  return <span>{unit}</span>;
};

export default UnitWithExponent;

