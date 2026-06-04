// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MusicRoyalty {
    struct Collaborator {
        address wallet;
        uint256 percentage;
    }

    struct Song {
        uint256 id;
        string title;
        string artist;
        string metadataURI;
        address uploader;
        uint256 playCount;
        uint256 totalRoyalty;
        bool exists;
    }

    uint256 public songCount;

    mapping(uint256 => Song) public songs;
    mapping(uint256 => Collaborator[]) private songCollaborators;
    mapping(address => uint256) public royaltyBalances;

    event SongUploaded(
        uint256 indexed songId,
        string title,
        string artist,
        address indexed uploader
    );

    event SongPlayed(
        uint256 indexed songId,
        address indexed listener,
        uint256 amount
    );

    event RoyaltyClaimed(
        address indexed user,
        uint256 amount
    );

    function uploadSong(
        string memory _title,
        string memory _artist,
        string memory _metadataURI,
        address[] memory _wallets,
        uint256[] memory _percentages
    ) public {
        require(bytes(_title).length > 0, "Judul lagu wajib diisi");
        require(bytes(_artist).length > 0, "Nama artis wajib diisi");
        require(_wallets.length > 0, "Minimal satu kolaborator");
        require(_wallets.length == _percentages.length, "Data kolaborator tidak sesuai");

        uint256 totalPercentage = 0;

        for (uint256 i = 0; i < _percentages.length; i++) {
            require(_wallets[i] != address(0), "Wallet tidak valid");
            require(_percentages[i] > 0, "Persentase harus lebih dari 0");
            totalPercentage += _percentages[i];
        }

        require(totalPercentage == 100, "Total persentase harus 100");

        songCount++;

        songs[songCount] = Song({
            id: songCount,
            title: _title,
            artist: _artist,
            metadataURI: _metadataURI,
            uploader: msg.sender,
            playCount: 0,
            totalRoyalty: 0,
            exists: true
        });

        for (uint256 i = 0; i < _wallets.length; i++) {
            songCollaborators[songCount].push(
                Collaborator({
                    wallet: _wallets[i],
                    percentage: _percentages[i]
                })
            );
        }

        emit SongUploaded(songCount, _title, _artist, msg.sender);
    }

    function playSong(uint256 _songId) public payable {
        require(songs[_songId].exists, "Lagu tidak ditemukan");
        require(msg.value > 0, "Royalti harus lebih dari 0");

        songs[_songId].playCount++;
        songs[_songId].totalRoyalty += msg.value;

        Collaborator[] memory collaborators = songCollaborators[_songId];

        for (uint256 i = 0; i < collaborators.length; i++) {
            uint256 share = (msg.value * collaborators[i].percentage) / 100;
            royaltyBalances[collaborators[i].wallet] += share;
        }

        emit SongPlayed(_songId, msg.sender, msg.value);
    }

    function claimRoyalty() public {
        uint256 amount = royaltyBalances[msg.sender];

        require(amount > 0, "Tidak ada royalti untuk diklaim");

        royaltyBalances[msg.sender] = 0;

        payable(msg.sender).transfer(amount);

        emit RoyaltyClaimed(msg.sender, amount);
    }

    function getCollaborators(
        uint256 _songId
    ) public view returns (Collaborator[] memory) {
        require(songs[_songId].exists, "Lagu tidak ditemukan");
        return songCollaborators[_songId];
    }

    function getSong(
        uint256 _songId
    )
        public
        view
        returns (
            uint256 id,
            string memory title,
            string memory artist,
            string memory metadataURI,
            address uploader,
            uint256 playCount,
            uint256 totalRoyalty
        )
    {
        require(songs[_songId].exists, "Lagu tidak ditemukan");

        Song memory song = songs[_songId];

        return (
            song.id,
            song.title,
            song.artist,
            song.metadataURI,
            song.uploader,
            song.playCount,
            song.totalRoyalty
        );
    }

    function getAllSongs() public view returns (Song[] memory) {
        Song[] memory allSongs = new Song[](songCount);

        for (uint256 i = 1; i <= songCount; i++) {
            allSongs[i - 1] = songs[i];
        }

        return allSongs;
    }
}