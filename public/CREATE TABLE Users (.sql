USE ocdadatabase;

IF OBJECT_ID('dbo.Members', 'U') IS NOT NULL
    DROP TABLE dbo.Members;

CREATE TABLE dbo.Members (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PhoneNumber VARCHAR(20) UNIQUE NOT NULL,
    phoneno2 VARCHAR(20) UNIQUE,
    Surname VARCHAR(100) NOT NULL,
    othernames VARCHAR(100),
    Title VARCHAR(50),
    HonTitle VARCHAR(50),
    Sex VARCHAR(10),
    Quarters VARCHAR(100),
    Ward VARCHAR(100),
    State VARCHAR(100),
    Town VARCHAR(100),
    DOB DATE,
    Qualifications VARCHAR(255),
    Profession VARCHAR(100),
    exitdate DATE,
    Password VARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'dbo.Members';


USE ocdadatabase;

IF OBJECT_ID('Admins', 'U') IS NOT NULL
    DROP TABLE Admins;
    
CREATE TABLE Admins (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  fullname VARCHAR(50) UNIQUE,
  Email VARCHAR(100) UNIQUE,
  Password VARCHAR(255),
  role VARCHAR(50),
  CreatedAt DATETIME DEFAULT GETDATE()
);



USE ocdadatabase;
CREATE TABLE Members (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PhoneNumber VARCHAR(20) UNIQUE NOT NULL,
    phoneno2 VARCHAR(20) UNIQUE,
    Surname VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    othernames VARCHAR(100),
    Title VARCHAR(50),
    HonTitle VARCHAR(50),
    Sex VARCHAR(10),
    Quarters VARCHAR(100),
    Ward VARCHAR(100),
    State VARCHAR(100),
    Town VARCHAR(100),
    DOB DATE,
    Qualifications VARCHAR(255),
    Profession VARCHAR(100),
    exitdate DATE,
    Password VARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);



