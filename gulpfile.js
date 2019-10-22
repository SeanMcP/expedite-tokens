const browserSync = require('browser-sync');
const gulp = require('gulp');
const theo = require('theo');
const ms = require('ms');

const gulpLoadPlugins = require('gulp-load-plugins');

const $ = gulpLoadPlugins();

theo.registerValueTransform(
    'filter',
    (prop) => prop.get('type') === 'color',
    (prop) => prop.getIn(['meta', 'filter']) || 'none',
);

theo.registerFormat(
    'spacing-map.scss',
    require('./formats/spacing-map.scss.js'),
);

theo.registerValueTransform(
    'timing/ms-unitless',
    (prop) => prop.get('type') === 'time',
    (prop) => (prop.get('value') === 0 ? 0 : ms(prop.get('value'))),
);

theo.registerTransform('web/js', ['color/rgb', 'timing/ms-unitless']);

theo.registerTransform('filter', ['filter']);

theo.registerFormat('ase.json', require('./formats/ase.json.js'));
theo.registerFormat('sketchpalette', require('./formats/sketchpalette.js'));
theo.registerFormat('color-map.scss', require('./formats/color-map.scss.js'));

const colorFilterFormats = [
    'scss',
    'common.js',
    'json',
    'custom-properties.css',
    'map.scss',
    'raw.json',
    'color-map.scss',
];

const addPrefix = {prefix: 'expedite-'};

const removePrefix = (gulpRenameOptions) => {
    gulpRenameOptions.basename = gulpRenameOptions.basename.replace(
        'expedite-',
        '',
    );
    return gulpRenameOptions;
};

const webFormats = [
    {transformType: 'web', formatType: 'scss'},
    {transformType: 'web/js', formatType: 'common.js'},
    {transformType: 'web/js', formatType: 'json'},
    {transformType: 'web', formatType: 'custom-properties.css'},
    {transformType: 'web', formatType: 'map.scss'},
    {transformType: 'web', formatType: 'raw.json'},
];

const colorFormats = [
    {transformType: 'web', formatType: 'color-map.scss'},
    {transformType: 'web', formatType: 'less'},
    {transformType: 'web', formatType: 'scss'},
    {transformType: 'web', formatType: 'html'},
    {transformType: 'web', formatType: 'json'},
    {transformType: 'web', formatType: 'ase.json'},
    {transformType: 'android', formatType: 'android.xml'},
    {transformType: 'web', formatType: 'sketchpalette'},
];

const positioningFormats = [
    {transformType: 'web', formatType: 'less'},
    {transformType: 'web', formatType: 'scss'},
    {transformType: 'web', formatType: 'json'},
];

const spacingFormats = [{transformType: 'web', formatType: 'spacing-map.scss'}];

gulp.task('print $', () => {
    console.log($)
})

gulp.task('web-formats', (done) => {
    webFormats.map(({transformType, formatType}) =>
        gulp
            .src('tokens/*.yml')
            .pipe($.rename(addPrefix))
            .pipe(
                $.theo({
                    transform: {type: transformType},
                    format: {type: formatType},
                }),
            )
            .pipe($.rename(removePrefix))
            .on('error', (err) => {
                throw new Error(err);
            })
            .pipe(gulp.dest('dist')),
    );
    done();
});

gulp.task('positioning-formats', (done) => {
    positioningFormats.map(({transformType, formatType}) => {
        return gulp
            .src('tokens/positioning.yml')
            .pipe(
                $.theo({
                    transform: {type: transformType, includeMeta: true},
                    format: {type: formatType},
                }),
            )
            .on('error', (err) => {
                throw new Error(err);
            })
            .pipe(gulp.dest('dist'))
    });
    done();
});

gulp.task('spacing-formats', (done) => {
    spacingFormats.map(({transformType, formatType}) =>
        gulp
            .src('tokens/spacing.yml')
            .pipe($.rename(addPrefix))
            .pipe(
                $.theo({
                    transform: {type: transformType, includeMeta: true},
                    format: {type: formatType},
                }),
            )
            .pipe($.rename(removePrefix))
            .on('error', (err) => {
                throw new Error(err);
            })
            .pipe(gulp.dest('dist')),
    );
    done();
});

const filterRename = {basename: 'color-filters'};

gulp.task('color-filters', (done) => {
    colorFilterFormats.map((format) =>
        gulp
            .src('tokens/colors.yml')
            .pipe($.rename(filterRename))
            .pipe($.rename(addPrefix))
            .pipe(
                $.theo({
                    transform: {type: 'filter'},
                    format: {type: format},
                }),
            )
            .pipe($.rename(removePrefix))
            .on('error', (err) => {
                throw new Error(err);
            })
            .pipe(gulp.dest('dist')),
    );
    done();
});

gulp.task('color-formats', (done) => {
    colorFormats.map(({transformType, formatType}) => {
        return gulp
            .src('tokens/colors.yml')
            .pipe(
                $.theo({
                    transform: {type: transformType, includeMeta: true},
                    format: {type: formatType},
                }),
            )
            .on('error', (err) => {
                throw new Error(err);
            })
            .pipe(gulp.dest('dist'))
    });
    done();
});

function serve(done) {
    browserSync.init({
        open: false,
        notify: false,
        server: 'docs',
    });
    done();
}

function reload(done) {
    browserSync.reload();
    done();
}

function watch() {
    gulp.watch(
        ['tokens/*.yml'],
        gulp.series(['web-formats', 'positioning-formats', 'color-formats', 'color-filters', 'positioning-formats', 'spacing-formats'],
        ),
    );
    // For when we are generating docs
    // gulp.watch('docs/**/*.scss', gulp.series('docs:styles'));
    gulp.watch(['formats/**/*.*', 'gulpfile.js'], gulp.series($.restart));
    gulp.watch(['docs/**/*.html'], gulp.series(reload));
}

gulp.task(
    'watch',
    gulp.series(
        ['web-formats', 'positioning-formats', 'color-formats', 'color-filters', 'positioning-formats', 'spacing-formats'],
        gulp.series(serve, watch),
    ),
);

gulp.task(
    'default',
    gulp.series(['web-formats', 'positioning-formats', 'color-formats', 'color-filters', 'positioning-formats', 'spacing-formats'],
    ),
);
