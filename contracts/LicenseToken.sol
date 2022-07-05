pragma solidity >=0.6.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './RootLicense.sol';
import './StringUtil.sol';

contract LicenseToken is ERC20, Ownable {
    event LicensePurchased(address indexed buyer,bytes32 secret);
    event RestoreLicense(address owner, bytes32 secret);
    event LicenseTokenPriceChange(uint newPrice, address licenseAddress);
    event LicenseTokenActivated(address licenseAddress);
    event LicenseTokenDeActivated(address licenseAddress);
    event BalanceChange(address appAddress, uint amount);

    modifier activated() {
        require(active, "The contract has not active yet");
        _;        
    }

    /**
        Price of app license
     */
    uint256 public price;
    
    /**
        App description is brief information about app and the contact of the owner of the app
     */
    string public appDescription;

    /**
        Status of the license 
        if active is false the app cannot be purchased or withdraw.
     */
    bool public active;

    /**
        The address of owner RootLicense
     */
    address public ownerRoot;

    /**
        The duration of the token and unit altogether to calculate the time in the future for the expiration
        of the purchased license
     */
    uint public durationPerToken;
    DurationUnit public unit;


    /**
        The timestamp that user first byte that token that will be reset to the current time of block 
        when all token the user hold is expired
     */ 
    mapping(address => uint256) public timeStampFirstBuy;

    /**
        The mac address of the address that purchased the license
     */
    mapping(address => string) public addressToMacAddress;

    string private secret;

    constructor(string memory name, 
                string memory symbol, 
                string memory _description, 
                address  _ownerRoot,
                address owner,
                uint _priceInWei,
                uint _durationPerToken, 
                DurationUnit _unit, 
                string memory _secret) ERC20(name, symbol) public {
        _mint(owner, 1);
        price = _priceInWei;
        active = false;
        ownerRoot = _ownerRoot;
        appDescription = _description;
        durationPerToken = _durationPerToken;
        unit = _unit;        
        secret = _secret;
        transferOwnership(owner);
    }

    /**
        Purchase license by clients and they will pay for at least the price of the license
        the buyer cannot buy the license for onther address
        @param owner the owner of token be _mint 
        @param macAddress the address of computer client
     */
    function purchaseLicense(address owner, string memory macAddress, uint amount) public payable activated {
        require(msg.value >= price * amount, 'The amount you sent is not enough to buy the tokens');
        require(msg.sender == owner, "You cannot purchase license for other address");
        purchaseInternal(owner, macAddress, amount);
    }

    /**
        Purchase the license by the owner of the license token
        @param owner the owner of the license token
        @param macAddress the address of computer client
     */
    function purchaseLicenseInternal(address owner, string memory macAddress, uint amount) public onlyOwner activated  {
        purchaseInternal(owner, macAddress,amount);
    }

    /**
        Function is used internally by other functions to purchase the license
        @param owner the owner of the license token
        @param macAddress the address of computer client
     */
    function purchaseInternal(address owner, string memory macAddress,uint amount) internal activated {
        updateTimeStampAndToken(owner);
        updateOwnerMacAddressInternal(owner, macAddress);
        _mint(owner, amount);
        emit LicensePurchased(owner,buildSecret(owner));
    }

    function buildSecret(address owner) internal view returns (bytes32) {
        return keccak256(bytes(StringUtil.strConcat(secret, StringUtil.addressToString(owner))));
    }

    /**
        Update the macAddress of the owner of the license token
        @param owner the owner of the license token
        @param macAddress the address of computer client
     */
    function updateOwnerMacAddressInternal(address owner, string memory macAddress) internal activated {
        require(owner != address(0), 'Invalid owner address');
        require(bytes(macAddress).length > 0, 'Mac address must be not empty');
        addressToMacAddress[owner] = macAddress;
    }

    /**
        Get the timestamp that user first buy the token
        @param newPrice is the new price of the license the new price must be greater than zero
     */
    function setLicensePrice(uint256 newPrice) public onlyOwner {
        require(newPrice > 0, "New price must greater than zero");
        price = newPrice;
        emit LicenseTokenPriceChange(newPrice, address(this));
    }

    /**
        Withdraw all balance of that contract
     */
    function withdraw() payable public  onlyOwner activated {
        payable(owner()).transfer(address(this).balance);
        emit BalanceChange(address(this),address(this).balance);
    }

    /**
        Activate the license token by the owner of RootLicense contract
     */
    function setActive(bool _active) public  {
        require(msg.sender == ownerRoot, "Only root can set active");
        active = _active;
        
        if(_active) {
            emit LicenseTokenActivated(address(this));
        }else{
            emit LicenseTokenDeActivated(address(this));
        }
    }

    /**
        Get the balance of the contract
     */
    function balance() public view returns(uint256) {
        return address(this).balance;
    }

    function restoreLicense(string memory newMacAddress) public payable activated {
        require(msg.value >= price / 2,"Get secret require at least half of the price");
        require(bytes(newMacAddress).length > 0, 'Mac address must be not empty');
        addressToMacAddress[msg.sender] = newMacAddress;
        emit RestoreLicense(msg.sender, buildSecret(msg.sender));
    }

    /**
        Get the expiration time of all tokens that user owned
     */
    function getExpiredTimestamp () public view returns (uint256){
        if(unit == DurationUnit.FOREVER){
            return 2**63;
        }
        address owner = msg.sender;
        return timeStampFirstBuy[owner] + balanceOf(owner) * durationPerToken * unitToMilis();
    }


    /**
        The millisecond corresponding to the unit of time
     */
    function unitToMilis() internal view returns (uint256) {
        if(unit == DurationUnit.DAY) {
            return 24 * 60 * 60 * 1000;
        } else if(unit == DurationUnit.MONTH) {
            return 30 * 24 * 60 * 60 * 1000;
        } else if(unit == DurationUnit.YEAR) {
            return 365 * 24 * 60 * 60 * 1000;
        }else if(unit == DurationUnit.SECOND){
            return 1000;
        }else if(unit == DurationUnit.FOREVER){
            return 2**63;
        }
        return 0;
    }

    /**
        Get the current time stamp of the block is mined in milliseconds
     */
    function getTimeNowInMillis() internal view returns (uint) {
        return block.timestamp * 1000;
    }

    /**
        Update the timestamp of first buy the token
        if all tokens are expired the timestamp will be reset to the current time of block
        and all tokens will be burned
        @param owner the owner of the license token
     */
    function updateTimeStampAndToken(address owner) internal activated {
        uint currentTimeMillis = getTimeNowInMillis();
        // If user already buy token, then update the timeStampFirstBuy
        if(timeStampFirstBuy[owner] != 0) {
             // If all tokens of user is expired
            if(currentTimeMillis >= getExpiredTimestamp()) {
                // Burn all tokens that expired
                _burn(owner, balanceOf(owner));
                timeStampFirstBuy[owner] = currentTimeMillis;
            }
        }else{
            // If user never buy token, then update the timeStampFirstBuy
            timeStampFirstBuy[owner] = currentTimeMillis;
        }
    }

}
