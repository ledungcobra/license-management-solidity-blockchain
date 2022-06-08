pragma solidity >=0.6.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './RootLicense.sol';

contract LicenseToken is ERC20, Ownable {

    event LicensePurchased(address indexed buyer);
    event LicenseTokenPriceChange(uint newPrice, address licenseAddress);
    event LicenseTokenActivated(address licenseAddress);
    event Log(address addr);

    uint256 public price;
    string public appDescription;
    bool public active;
    address public ownerRoot;
    uint public durationPerToken;
    DurationUnit public unit;

    // The timestamp that user first byte that token;
    mapping(address => uint256) timeStampFirstBye;
    constructor(string memory name, 
                string memory symbol, 
                string memory _description, 
                address  _ownerRoot,
                address owner,
                uint _priceInWei,
                uint _durationPerToken, 
                DurationUnit _unit) ERC20(name, symbol) public {
        _mint(owner, 1);
        price = _priceInWei;
        active = false;
        ownerRoot = _ownerRoot;
        appDescription = _description;
        durationPerToken = _durationPerToken;
        unit = _unit;        
        transferOwnership(owner);
    }
    modifier activated() {
        require(active, "The contract has not active yet");
        _;        
    }
    function purchaseLicense(address owner) public payable activated {
        require(owner != address(0), 'INVALID_OWNER_ADDRESS');
        require(msg.value >= price, 'INSUFFICIENT_FUNDS');
        updateTimeStampAndToken(owner);
        _mint(owner, 1);
        emit LicensePurchased(owner);
    }

    function purchaseLicenseInternal(address owner) public onlyOwner activated  {
        require(owner != address(0), 'INVALID_OWNER_ADDRESS');
        updateTimeStampAndToken(owner);
        _mint(owner, 1);
        emit LicensePurchased(owner);
    }

    function updateTimeStampAndToken(address owner) internal {
        // If user first buy token
        if(timeStampFirstBye[owner] == 0) {
            timeStampFirstBye[owner] = now;
        }else{

            // If all tokens of user is expired
            if(now >= getExpiredTimestamp(owner)) {
                // Burn all tokens that expired
                _burn(owner, balanceOf(owner));
            }

            timeStampFirstBye[owner] = now;
        }
    }

    function setLicensePrice(uint256 newPrice) public onlyOwner {
        price = newPrice;
        emit LicenseTokenPriceChange(newPrice, address(this));
    }

    function withdraw() payable public  onlyOwner activated {
        payable(owner()).transfer(address(this).balance);
    }

    function setActive(bool _active) public  {
        emit Log(msg.sender);
        require(msg.sender == ownerRoot, "Only root can set active");
        active = _active;
        emit LicenseTokenActivated(address(this));
    }

    function balance() public view returns(uint256) {
        return address(this).balance;
    }

    function getExpiredTimestamp (address owner) public view returns (uint256){
        return timeStampFirstBye[owner] + balanceOf(owner) * durationPerToken * unitToMilis();
    }

    function unitToMilis() public view returns (uint256) {
        if(unit == DurationUnit.DAY) {
            return 24 * 60 * 60 * 1000;
        } else if(unit == DurationUnit.MONTH) {
            return 30 * 24 * 60 * 60 * 1000;
        } else if(unit == DurationUnit.YEAR) {
            return 365 * 24 * 60 * 60 * 1000;
        }
        return 0;
    }
    
}
