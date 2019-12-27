function settings(props) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">Players</Text>}>
        <AdditiveList
          maxItems="20"
          settingsKey="players"
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(settings);
