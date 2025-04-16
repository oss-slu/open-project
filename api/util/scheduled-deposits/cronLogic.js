const { prisma } = require('#prisma'); 

const performAutomatedDeposits = async () => {
  try {
    const depositData = {
      type: 'AUTOMATED_DEPOSIT',
      automatedLedgerPostItemValue: 100.0, //default value, for now
      automatedLedgerPostItemType: 'DEPOSIT',
    };
    const ledgerItem = await prisma.ledgerItem.create({
      data: depositData,
    });

    console.log('Automated deposit completed:', ledgerItem);
  } catch (error) {
    console.error('Error performing automated deposit:', error);
  }
};

const performAutomatedTopUp = async () => {
  try {
    const topUpData = {
      type: 'AUTOMATED_TOPUP',
      automatedLedgerPostItemValue: 50.0, //default value, for now
      automatedLedgerPostItemType: 'TOPUP',
    };
    const ledgerItem = await prisma.ledgerItem.create({
      data: topUpData,
    });

    console.log('Automated top-up completed:', ledgerItem);
  } catch (error) {
    console.error('Error performing automated top-up:', error);
  }
};

module.exports = { performAutomatedDeposits, performAutomatedTopUp };

