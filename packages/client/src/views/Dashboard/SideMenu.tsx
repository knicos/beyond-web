import React from 'react';
import { FaHome, FaUserAlt, FaServer, FaVideo, FaChartLine, FaListAlt, FaTable, FaCubes, FaFilm, FaPencilAlt, FaChalkboard, FaPaintBrush, FaThumbsUp } from 'react-icons/fa';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const Container = styled.section`
  display: flex;
  flex-direction: column;
  flex: 0 0 15rem;
  background: white;
  box-shadow: 2px 0 8px #ddd;
  padding-top: 2rem;
  gap: 0.5rem;

  a {
    padding: 0.5rem 1.5rem;
    margin: 0;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: ${props => props.theme.text.dark};
    text-decoration: none;

    &:hover {
      background: #eee;
      color: black;
    }
  }
`;

const MenuText = styled.span`
  font-weight: bold;
  margin-left: 1rem;
`;

const MenuSpacer = styled.div`
  border-top: 1px solid silver;
  margin: 1rem 0;
`;

export function SideMenu() {
  const path = process.env.ASSET_PATH;

  return (
    <Container>
      <Link to={path}>
        <FaHome />
        <MenuText>Home</MenuText>
      </Link>
      <Link to={`${path}configs`}>
        <FaTable />
        <MenuText>My Configurations</MenuText>
      </Link>
      <MenuSpacer />
      <Link to={`${path}nodes`}>
        <FaServer />
        <MenuText>Nodes</MenuText>
      </Link>
      <Link to={`${path}users`}>
        <FaUserAlt />
        <MenuText>Users</MenuText>
      </Link>
      <Link to={`${path}groups`}>
        <FaListAlt />
        <MenuText>Groups</MenuText>
      </Link>
      <Link to={`${path}stats`}>
        <FaChartLine />
        <MenuText>Statistics</MenuText>
      </Link>
      <Link to={`${path}recordings`}>
        <FaFilm />
        <MenuText>Recordings</MenuText>
      </Link>
      <Link to={`${path}whiteboard`}>
        <FaPaintBrush />
        <MenuText>Sketchpad</MenuText>
      </Link>
      <Link target="_blank" to={`${path}reactions`}>
        <FaThumbsUp />
        <MenuText>Reactions</MenuText>
      </Link>
    </Container>
  )
}
